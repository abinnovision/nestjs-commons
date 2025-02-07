# @abinnovision/nestjs-configx

Simple configuration management for NestJS using Zod.

## Installation

```bash
yarn add @abinnovision/nestjs-configx
```

## Usage

### Define the configuration

First, you need to define the configuration. This is done by creating a class
that extends the return value of the `configx` function.

The function takes a single argument, which is an object that maps the
environment variable names to Zod schemas. The key must be the environment
variable name to resolve.

The Zod schema supports a subset of Zod's types, see here for all supported
types.

```typescript
import { configx } from "@abinnovision/nestjs-configx";
import { z } from "zod";

export class AppConfigx extends configx({
  PORT: z.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
}) {}
```

### Register the configuration

Next, you need to register the configuration in your NestJS module. This is
done by calling the `register` method of the `ConfigxModule`.

The method takes multiple Configx classes as arguments, which will be used to
resolve the configuration.

```typescript
import { ConfigxModule } from "@abinnovision/nestjs-configx";
import { Module } from "@nestjs/common";

import { AppConfigx } from "./app.configx";

@Module({
  imports: [ConfigxModule.register(AppConfigx)],
})
export class AppModule {}
```

### Use the configuration

Finally, you can use the configuration in your NestJS components.

```typescript
import { Injectable } from "@nestjs/common";

import { AppConfigx } from "./app.configx";

@Injectable()
export class AppService {
  constructor(private readonly appConfig: AppConfigx) {}

  getConfig() {
    // Get the configuration value.
    return this.appConfig.PORT;
  }
}
```

## Supported Zod types

- `z.string()`
- `z.number()`
- `z.boolean()`

The following modifiers are supported:

- `z.default(value)`
- `z.optional()`
- `z.nullable()`
