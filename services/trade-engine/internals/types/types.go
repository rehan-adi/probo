package types

type QueuePayload struct {
	ResponseId string      `json:"responseId"`
	EventType  string      `json:"eventType"`
	Data       interface{} `json:"data"`
}

type QueueResponse struct {
	ResponseId string
	Status     string
	Message    string
}
