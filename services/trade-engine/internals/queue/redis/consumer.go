package redis

import (
	"context"
	"encoding/json"
	"time"
	"trade-engine/internals/handlers"
	"trade-engine/internals/types"

	"github.com/rs/zerolog/log"
)

func Consumer(ctx context.Context) {

	log.Info().Msg("Consumer started")

	for {

		result, err := Client.BRPop(ctx, 30*time.Second, "engine:queue").Result()

		if err != nil {
			log.Warn().Err(err).Msg("Failed to consume from queue")
			continue

		}

		log.Info().Strs("result", result).Msg("Message from engine:queue")

		if len(result) != 2 {
			log.Warn().Msg("invalid BRPop result length")
			continue
		}

		var data types.QueuePayload

		err = json.Unmarshal([]byte(result[1]), &data)

		if err != nil {
			log.Error().Err(err).Str("payload", result[1])
		}

		log.Info().
			Str("eventType", data.EventType).
			Str("responseId", data.ResponseId).
			Interface("data", data.Data).
			Msg("Successfully parsed queue payload")

		handlers.RouteEvent(data)

	}

}
