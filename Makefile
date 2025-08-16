.PHONY: build run clean

build:
	cd services/matching-engine && go build -o bin/matching-engine ./cmd

run:
	cd services/matching-engine && go run ./cmd

clean:
	cd services/matching-engine && rm -rf bin/
