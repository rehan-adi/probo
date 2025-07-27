package main

import (
	"context"
	"fmt"

	"trade-engine/internals/engine"
	"trade-engine/internals/queue/redis"
	"trade-engine/internals/utils"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

func main() {

	// load env variables
	if err := godotenv.Load(); err != nil {
		fmt.Println("Failed to load env")
	}

	// Initialize zerolog logger
	utils.InitLogger()
	log.Info().Msg("📄 Logger initialized")

	// connect to redis
	redis.ConnectRedis()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize engine
	engine.InitEngine()
	log.Info().Msg("Trade engine initialized")

	redis.Consumer(ctx)

	log.Info().Msg("🚀 Trade Engine started successfully")

}
