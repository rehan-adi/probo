package redis

import (
	"context"
	"encoding/json"
	"time"
	"trade-engine/internals/router"
	"trade-engine/internals/types"

	"github.com/rs/zerolog/log"
)

func Consumer(ctx context.Context) {

	log.Info().Msg("Consumer started")

	for {

		result, err := Client.BRPop(ctx, 5*time.Minute, "engine:queue").Result()

		if err != nil {
			log.Warn().Err(err).Msg("Failed to consume from queue")
			continue

		}

		if len(result) != 2 {
			log.Warn().Msg("invalid BRPop result length")
			continue
		}

		var data types.QueuePayload

		err = json.Unmarshal([]byte(result[1]), &data)

		if err != nil {
			log.Error().Err(err).Str("payload", result[1]).Msg("Failed to unmarshal payload")
			continue
		}

		log.Info().
			Str("eventType", data.EventType).
			Str("responseId", data.ResponseId).
			Interface("data", data.Data).
			Msg("Successfully parsed queue payload")

		response := router.RouteEvent(data)

		responseJSON, err := json.Marshal(response)

		if err != nil {
			log.Error().Err(err).Msg("Failed to marshal response")
			continue
		}

		responseKey := "engine:response:" + response.ResponseId

		err = Client.Publish(ctx, responseKey, responseJSON).Err()

		if err != nil {
			log.Error().Err(err).Str("responseId", response.ResponseId).Msg("Failed to send response to api")
		} else {
			log.Info().Str("responseId", response.ResponseId).Msg("Response send to api successfully")
		}

	}

}
