package engine

import (
	"sync"
	"trade-engine/internals/types"
)

type Engine struct {
	User   map[string]*types.User
	Market map[string]*types.Market
	UM     sync.RWMutex
	MM     sync.RWMutex
}

var EngineInstance *Engine

func InitEngine() {
	EngineInstance = &Engine{
		User:   make(map[string]*types.User),
		Market: make(map[string]*types.Market),
	}
}

func (e *Engine) AddMarket(market *types.Market) {

	e.MM.Lock()
	defer e.MM.Unlock()

	e.Market[market.Symbol] = market

	go e.runMarket(market)
}

func (e *Engine) GetMarket(symbol string) (*types.Market, bool) {

	e.MM.RLock()
	defer e.MM.RUnlock()

	market, ok := e.Market[symbol]

	return market, ok
}
