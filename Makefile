.PHONY: build run clean

build:
	cd services/trade-engine && go build -o bin/trade-engine ./cmd

run:
	cd services/trade-engine && go run ./cmd

clean:
	cd services/trade-engine && rm -rf bin/
