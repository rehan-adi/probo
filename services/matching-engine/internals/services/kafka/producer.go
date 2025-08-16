package kafka

import (
	"encoding/json"
	"sync"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/rs/zerolog/log"
)

var (
	producerInstance *kafka.Producer
	once             sync.Once
)

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func InitProducer() {
	once.Do(func() {
		producer, err := kafka.NewProducer(&kafka.ConfigMap{
			"bootstrap.servers": "localhost",
		})

		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create Kafka producer")
		}
		producerInstance = producer

		go func() {
			for e := range producerInstance.Events() {
				switch ev := e.(type) {
				case *kafka.Message:
					if ev.TopicPartition.Error != nil {
						log.Error().Err(ev.TopicPartition.Error).Msg("🚨 Kafka delivery failed")
					} else {
						log.Debug().Msgf("✅ Delivered to %v", ev.TopicPartition)
					}
				}
			}
		}()

		log.Info().Msg("📡 Kafka Producer connected")
	})
}

func ProduceEventToDBProcessor(topic, eventType string, data interface{}) error {
	if producerInstance == nil {
		log.Error().Msg("Producer not initialized")
		return nil
	}

	event := Event{
		Type: eventType,
		Data: data,
	}
	bytes, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return producerInstance.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &topic,
			Partition: kafka.PartitionAny,
		},
		Value: bytes,
	}, nil)
}

func CloseProducer() {
	if producerInstance != nil {
		producerInstance.Flush(5000)
		producerInstance.Close()
	}
}
