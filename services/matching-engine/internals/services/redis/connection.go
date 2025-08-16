package redis

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

func ConnectRedis() *redis.Client {

	url := os.Getenv("REDIS_URL")

	option, err := redis.ParseURL(url)

	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse redis url")
	}

	client := redis.NewClient(option)

	_, err = client.Ping(context.Background()).Result()

	if err != nil {
		log.Error().Err(err).Msg("failed to connect to redis")
	}

	log.Info().Msg("connected to redis")

	return client

}
