# Logger Package

A shared structured logging library powered by [Pino](https://github.com/pinojs/pino).

It provides a unified `createLogger` utility for all microservices in the Probo workspace. During development, it automatically uses `pino-pretty` to format logs into easily readable output. In production, it writes highly optimized JSON logs.

## Usage

This package is designed to be imported by other services:

```typescript
import { createLogger } from '@probo/logger';

const logger = createLogger('my-service-name');

logger.info('Service started successfully!');
logger.error({ err }, 'An error occurred');
```

You can optionally configure the log level via the `LOG_LEVEL` environment variable (`debug`, `info`, `warn`, `error`).
