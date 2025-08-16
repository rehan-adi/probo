package utils

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func InitLogger() {

	APP_ENV := os.Getenv("APP_ENV")
	VERSION := os.Getenv("VERSION")
	LOG_LEVEL := os.Getenv("LOG_LEVEL")
	SERVICE_NAME := os.Getenv("SERVICE_NAME")

	level, err := zerolog.ParseLevel(LOG_LEVEL)

	if err != nil {
		if APP_ENV == "dev" {
			level = zerolog.DebugLevel
		} else {
			level = zerolog.InfoLevel
		}
	}

	if APP_ENV == "dev" {
		log.Logger = zerolog.New(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			NoColor:    false,
			TimeFormat: "3:04:05PM",
		}).
			Level(level).
			With().
			Str("service", SERVICE_NAME).
			Str("version", VERSION).
			Timestamp().
			Caller().
			Logger()
	} else {
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
		log.Logger = zerolog.New(os.Stdout).
			Level(level).
			With().
			Str("service", SERVICE_NAME).
			Str("version", VERSION).
			Timestamp().
			Logger()
	}
	log.Logger = log.Logger.Hook(zerolog.HookFunc(func(e *zerolog.Event, level zerolog.Level, msg string) {
		if level == zerolog.ErrorLevel || level == zerolog.FatalLevel {
			e.Stack()
		}
	}))
}
