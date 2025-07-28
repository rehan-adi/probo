package types

type QueuePayload struct {
	ResponseId string      `json:"responseId"`
	EventType  string      `json:"eventType"`
	Data       interface{} `json:"data"`
}

type Status string

const (
	Success Status = "success"
	Error   Status = "error"
)

type QueueResponse struct {
	ResponseId string
	Status     Status
	Message    string
	Retryable  bool
	Data       interface{}
}
