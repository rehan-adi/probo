package utils

import (
	"matching-engine/internals/types"
)

func GetYesProbability(book types.AggregatedOrderBook) float64 {
	totalYes := 0.0
	totalNo := 0.0

	for _, l := range book.Yes {
		totalYes += l.Price * float64(l.Quantity)
	}

	for _, l := range book.No {
		totalNo += l.Price * float64(l.Quantity)
	}

	if totalYes+totalNo == 0 {
		return 0.5
	}

	return totalYes / (totalYes + totalNo)
}
