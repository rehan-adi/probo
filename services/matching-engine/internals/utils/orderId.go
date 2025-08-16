package utils

import (
	"strings"

	"github.com/google/uuid"
)

func GenerateOrderID() string {
	return strings.ReplaceAll(uuid.New().String(), "-", "")[:10]
}
