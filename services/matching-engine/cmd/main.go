package main

import (
	"context"
	"fmt"

	"matching-engine/internals/engine"
	"matching-engine/internals/services/kafka"
	"matching-engine/internals/services/redis"
	"matching-engine/internals/utils"

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
	client := redis.ConnectRedis()

	// conect to kafka
	kafka.InitProducer()
	defer kafka.CloseProducer()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize engine
	engine.InitEngine(client)
	log.Info().Msg("Trade engine initialized")

	redis.Consumer(ctx, client)

	log.Info().Msg("🚀 Trade Engine started successfully")

}
