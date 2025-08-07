package handlers

import (
	"time"
	"trade-engine/internals/engine"
	"trade-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type CreateMarketRequest struct {
	ID            string  `mapstructure:"marketId"`
	Symbol        string  `mapstructure:"symbol"`
	SourceOfTruth string  `mapstructure:"sourceOfTruth"`
	Description   string  `mapstructure:"description"`
	Category      string  `mapstructure:"categoryId"`
	StartDate     string  `mapstructure:"startDate"`
	EndDate       string  `mapstructure:"endDate"`
	YesPrice      float32 `mapstructure:"yesPrice"`
	NoPrice       float32 `mapstructure:"NoPrice"`
}

func CreateMarket(payload types.QueuePayload) types.QueueResponse {
	var data CreateMarketRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		log.Error().
			Err(err).
			Str("responseId", payload.ResponseId).
			Msg("Failed to decode payload")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid data structure",
			Retryable:  true,
		}
	}

	startTime, err := time.Parse(time.RFC3339, data.StartDate)
	if err != nil {
		log.Error().Err(err).Msg("Invalid startDate format")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid startDate format",
			Retryable:  false,
		}
	}

	endTime, err := time.Parse(time.RFC3339, data.EndDate)
	if err != nil {
		log.Error().Err(err).Msg("Invalid endDate format")
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid endDate format",
			Retryable:  false,
		}
	}

	market := &types.Market{
		MarketId:    data.ID,
		Symbol:      data.Symbol,
		Decsription: data.Description,
		Category:    data.Category,
		YesPrice:    data.YesPrice,
		NoPrice:     data.NoPrice,
		Status:      types.Open,
		Inbox:       make(chan types.MarketMessage, 100),
		OrderBook:   &types.OrderBook{},
		Overview: types.Overview{
			StartDate:     startTime,
			EndDate:       endTime,
			SourceOfTruth: data.SourceOfTruth,
			Details:       "Some random things",
		},
	}

	engine.EngineInstance.AddMarket(market)

	log.Info().
		Str("marketId", data.ID).
		Msg("Market created and added to engine")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Success,
		Message:    "Market created",
	}
}

func GetAllMarkets() types.QueueResponse {

	engine.EngineInstance.MM.RLock()
	defer engine.EngineInstance.MM.RUnlock()

	markets := engine.EngineInstance.Market

	return types.QueueResponse{
		Status:  types.Success,
		Message: "Fetched all markets",
		Data:    markets,
	}
}
