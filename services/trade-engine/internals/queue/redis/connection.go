package redis

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

var Client *redis.Client

func ConnectRedis() {

	url := os.Getenv("REDIS_URL")

	option, err := redis.ParseURL(url)

	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse redis url")
	}

	Client = redis.NewClient(option)

	_, err = Client.Ping(context.Background()).Result()

	if err != nil {
		log.Error().Err(err).Msg("failed to connect to redis")
	}

	log.Info().Msg("connected to redis")

}
