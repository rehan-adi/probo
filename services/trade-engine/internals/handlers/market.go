package handlers

import (
	"time"
	"trade-engine/internals/engine"
	"trade-engine/internals/types"

	"github.com/mitchellh/mapstructure"
	"github.com/rs/zerolog/log"
)

type CreateMarketDataRequest struct {
	ID              string  `mapstructure:"marketId"`
	Title           string  `mapstructure:"title"`
	Symbol          string  `mapstructure:"symbol"`
	Description     string  `mapstructure:"description"`
	YesPrice        float32 `mapstructure:"yesPrice"`
	NoPrice         float32 `mapstructure:"NoPrice"`
	Thumbnail       string  `mapstructure:"thumbnail"`
	CategoryId      string  `mapstructure:"categoryId"`
	SourceOfTruth   string  `mapstructure:"sourceOfTruth"`
	StartDate       string  `mapstructure:"startDate"`
	EndDate         string  `mapstructure:"endDate"`
	NumberOfTraders int16   `mapstructure:"numberOfTraders"`
}

type GetMarketDetailsDataRequest struct {
	Symbol string `json:"symbol"`
}

func CreateMarket(payload types.QueuePayload) types.QueueResponse {
	var data CreateMarketDataRequest

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
		MarketId:        data.ID,
		Title:           data.Title,
		Symbol:          data.Symbol,
		Description:     data.Description,
		YesPrice:        data.YesPrice,
		NoPrice:         data.NoPrice,
		Thumbnail:       data.Thumbnail,
		CategoryId:      data.CategoryId,
		NumberOfTraders: data.NumberOfTraders,
		Volume:          0,
		Status:          types.Open,
		Inbox:           make(chan types.MarketMessage, 100),
		OrderBook:       &types.OrderBook{},
		Overview: types.Overview{
			StartDate:     startTime,
			EndDate:       endTime,
			SourceOfTruth: data.SourceOfTruth,
			Details:       "Some random things right now",
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

func GetMarketDetails(payload types.QueuePayload) types.QueueResponse {

	var data GetMarketDetailsDataRequest

	if err := mapstructure.Decode(payload.Data, &data); err != nil {
		return types.QueueResponse{
			ResponseId: payload.ResponseId,
			Status:     types.Error,
			Message:    "Invalid format",
		}
	}

	engine.EngineInstance.MM.RLock()
	defer engine.EngineInstance.MM.RUnlock()

	for _, market := range engine.EngineInstance.Market {

		if market.Symbol == data.Symbol {
			log.Info().
				Str("symbol", data.Symbol).
				Msg("Market found successfully")
			return types.QueueResponse{
				ResponseId: payload.ResponseId,
				Status:     types.Success,
				Message:    "Market details fetched successfully",
				Data: struct {
					MarketId    string             `json:"marketId"`
					Title       string             `json:"title"`
					Symbol      string             `json:"symbol"`
					Description string             `json:"description"`
					YesPrice    float32            `json:"yesPrice"`
					NoPrice     float32            `json:"noPrice"`
					Thumbnail   string             `json:"thumbnail"`
					Volume      float64            `json:"volume"`
					Status      string             `json:"status"`
					OrderBook   types.OrderBook    `json:"orderbook"`
					Overview    types.Overview     `json:"overview"`
					Activities  []types.Activity   `json:"activities"`
					Timeline    []types.PricePoint `json:"timeline"`
				}{
					MarketId:    market.MarketId,
					Title:       market.Title,
					Symbol:      market.Symbol,
					Volume:      market.Volume,
					YesPrice:    market.YesPrice,
					Thumbnail:   market.Thumbnail,
					Description: market.Description,
					NoPrice:     market.NoPrice,
					Status:      string(market.Status),
					OrderBook:   *market.OrderBook,
					Overview:    market.Overview,
					Activities:  market.Activities,
					Timeline:    market.Timeline,
				},
			}
		}
	}

	log.Warn().
		Str("symbol", data.Symbol).
		Msg("Market not found for symbol")

	return types.QueueResponse{
		ResponseId: payload.ResponseId,
		Status:     types.Error,
		Message:    "Market not found",
	}

}
