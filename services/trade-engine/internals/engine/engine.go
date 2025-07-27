package engine

import (
	"sync"
	"trade-engine/internals/types"
)

type Engine struct {
	User   map[string]*types.User
	Market map[string]*types.Market
	UM     sync.RWMutex
}

var EngineInstance *Engine

func InitEngine() {
	EngineInstance = &Engine{
		User:   make(map[string]*types.User),
		Market: make(map[string]*types.Market),
	}
}
