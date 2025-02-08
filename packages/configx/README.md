# @abinnovision/nestjs-configx

Simple configuration management for NestJS.
Supports [Standard Schema](https://standardschema.dev/).

## Installation

```bash
yarn add @abinnovision/nestjs-configx
```

## Schema Libraries

This library implements the [Standard Schema](https://standardschema.dev/)
specification. This means that you can use any schema library that implements
the specification.

A full list of **libraries that implement the specification can be found
[here](https://standardschema.dev/#what-schema-libraries-implement-the-spec)**.

This library is tested with the following libraries:

- [Zod](https://github.com/colinhacks/zod)
- [ArkType](https://github.com/arktypeio/arktype)

## Usage

### Define the configuration

First, you need to define the configuration. This is done by creating a class
that extends the return value of the `configx` function.

The function takes a single argument, which is an object schema that maps the
environment variables.

#### Using Zod

```typescript
import { configx } from "@abinnovision/nestjs-configx";
import { z } from "zod";

export class AppConfigx extends configx(
  z.object({
    PORT: z.string().default("3000").transform(Number).pipe(z.number()),
    HOST: z.string().default("0.0.0.0"),
  }),
) {}
```

#### Using ArkType

```typescript
import { configx } from "@abinnovision/nestjs-configx";
import { type } from "arktype";

export class AppConfigx extends configx(
  type({
    PORT: "string.numeric.parse = '3000'",
    HOST: "string = '127.0.0.1'",
  }),
) {}
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
