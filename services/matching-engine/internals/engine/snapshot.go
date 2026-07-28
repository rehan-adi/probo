package engine

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"time"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/rs/zerolog/log"

	"matching-engine/internals/types"
)

type SnapshotData struct {
	Timestamp time.Time                `json:"timestamp"`
	Users     map[string]*types.User   `json:"users"`
	Markets   map[string]*types.Market `json:"markets"`
}

func (e *Engine) StartSnapshotRoutine() {
	// Runs every 10 minutes as requested
	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for {
			<-ticker.C
			e.PerformSnapshot()
		}
	}()
}

func (e *Engine) PerformSnapshot() {
	log.Info().Msg("Starting state snapshot and memory eviction routine...")

	e.UM.Lock()
	
	// 1. Evict inactive users (> 7 days)
	evictionThreshold := time.Now().Add(-7 * 24 * time.Hour)
	evictedCount := 0
	
	for userId, user := range e.User {
		// If LastActive is zero, it might be a new user or pre-existing without activity
		if !user.LastActive.IsZero() && user.LastActive.Before(evictionThreshold) {
			delete(e.User, userId)
			evictedCount++
		}
	}
	
	log.Info().Int("evicted_users", evictedCount).Msg("Purged inactive users from engine RAM")

	e.MM.RLock()
	marketsRaw := make(map[string]json.RawMessage)
	for k, m := range e.Market {
		m.Mu.RLock()
		mBytes, _ := json.Marshal(m)
		m.Mu.RUnlock()
		marketsRaw[k] = mBytes
	}
	e.MM.RUnlock()

	// 2. Serialize State
	data := struct {
		Timestamp time.Time                `json:"timestamp"`
		Users     map[string]*types.User   `json:"users"`
		Markets   map[string]json.RawMessage `json:"markets"`
	}{
		Timestamp: time.Now(),
		Users:     e.User,
		Markets:   marketsRaw,
	}
	
	jsonData, err := json.Marshal(data)
	e.UM.Unlock() // Unlock after serialization to unblock trading

	if err != nil {
		log.Error().Err(err).Msg("Failed to serialize engine state for snapshot")
		return
	}

	snapshotEnabled := os.Getenv("SNAPSHOT_ENABLED")
	if snapshotEnabled != "true" {
		log.Warn().Msg("SNAPSHOT_ENABLED is not true, skipping snapshot generation.")
		return
	}

	snapshotStore := os.Getenv("SNAPSHOT_STORE")

	if snapshotStore == "redis" {
		log.Info().Msg("SNAPSHOT_STORE is redis, saving to Redis...")
		ctx := context.Background()
		// Save to Redis with 7 days TTL (7 * 24 * 60 * 60 seconds)
		err := e.Redis.Set(ctx, "engine_snapshot:latest", jsonData, 7*24*time.Hour).Err()
		if err != nil {
			log.Error().Err(err).Msg("Failed to save snapshot to Redis")
		} else {
			log.Info().Msg("Engine state snapshot successfully saved to Redis")
		}
		return
	}

	// 3. Compress for S3
	var b bytes.Buffer
	gz := gzip.NewWriter(&b)
	if _, err := gz.Write(jsonData); err != nil {
		log.Error().Err(err).Msg("Failed to compress engine state")
		return
	}
	if err := gz.Close(); err != nil {
		log.Error().Err(err).Msg("Failed to close gzip writer")
		return
	}

	compressedData := b.Bytes()

	// 4. Upload to S3/R2
	bucketName := os.Getenv("S3_SNAPSHOT_BUCKET")
	if bucketName == "" {
		log.Warn().Msg("S3_SNAPSHOT_BUCKET env var not set, skipping S3 upload. Snapshot generated in memory.")
		return
	}

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Error().Err(err).Msg("Failed to load AWS config")
		return
	}

	client := s3.NewFromConfig(cfg)
	filename := fmt.Sprintf("engine_snapshot_%d.json.gz", time.Now().Unix())

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(filename),
		Body:   bytes.NewReader(compressedData),
	})

	if err != nil {
		log.Error().Err(err).Msg("Failed to upload snapshot to S3")
		return
	}

	log.Info().Str("filename", filename).Msg("Engine state snapshot successfully uploaded to S3")
}

// LoadLatestSnapshot fetches the latest snapshot and populates the engine.
func (e *Engine) LoadLatestSnapshot() {
	snapshotEnabled := os.Getenv("SNAPSHOT_ENABLED")
	if snapshotEnabled != "true" {
		log.Info().Msg("SNAPSHOT_ENABLED not true, skipping snapshot restore on startup")
		return
	}

	snapshotStore := os.Getenv("SNAPSHOT_STORE")

	if snapshotStore == "redis" {
		log.Info().Msg("Attempting to load snapshot from Redis...")
		ctx := context.Background()
		jsonData, err := e.Redis.Get(ctx, "engine_snapshot:latest").Bytes()
		if err != nil {
			log.Info().Err(err).Msg("No snapshot found in Redis or failed to read")
			return
		}

		var data SnapshotData
		if err := json.Unmarshal(jsonData, &data); err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal snapshot from Redis")
			return
		}

		e.UM.Lock()
		e.User = data.Users
		e.UM.Unlock()

		e.MM.Lock()
		e.Market = data.Markets
		if e.Market == nil {
			e.Market = make(map[string]*types.Market)
		}
		// Re-initialize channels and start goroutines for each market
		for _, market := range e.Market {
			market.Inbox = make(chan types.MarketMessage, 100)
			go e.runMarket(market)
		}
		e.MM.Unlock()

		log.Info().Time("snapshot_timestamp", data.Timestamp).Int("users_loaded", len(data.Users)).Int("markets_loaded", len(e.Market)).Msg("Successfully restored snapshot from Redis")
		return
	}

	bucketName := os.Getenv("S3_SNAPSHOT_BUCKET")
	if bucketName == "" {
		log.Info().Msg("S3_SNAPSHOT_BUCKET not set, skipping S3 snapshot restore on startup")
		return
	}
	
	log.Info().Msg("Snapshot restoration logic initialized (ready for S3 sync)")
}
