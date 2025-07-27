package main

import (
	"context"
	"trade-engine/internals/engine"
	"trade-engine/internals/queue/redis"
	"trade-engine/internals/utils"

	"github.com/joho/godotenv"
)

func main() {

	godotenv.Load()

	utils.InitLogger()

	redis.ConnectRedis()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	engine.InitEngine()

	redis.Consumer(ctx)

}
