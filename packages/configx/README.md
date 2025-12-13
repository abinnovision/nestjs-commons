# @abinnovision/nestjs-configx

Type-safe configuration for NestJS using [Standard Schema](https://standardschema.dev/).

## Goals

- Type-safe configuration from `process.env`
- Schema-agnostic via Standard Schema (Zod, ArkType, etc.)
- Minimal NestJS integration (just a provider, no module)
- Fail-fast validation at startup

## Non-goals

- Multiple config sources (at least not yet)
- Async schema validation
- Runtime config reloading
- Secret management / encryption

## Installation

```bash
yarn add @abinnovision/nestjs-configx
```

## Usage

### 1. Define your config

```typescript
import { configx } from "@abinnovision/nestjs-configx";
import { z } from "zod";

export class AppConfigx extends configx(
  z.object({
    PORT: z.string().default("3000").transform(Number),
    HOST: z.string().default("0.0.0.0"),
  }),
) {}
```

### 2. Register as provider

```typescript
import { Module } from "@nestjs/common";
import { AppConfigx } from "./app.configx";

@Module({
  providers: [AppConfigx],
  exports: [AppConfigx],
})
export class AppModule {}
```

### 3. Inject and use

```typescript
@Injectable()
export class AppService {
  constructor(private readonly config: AppConfigx) {}

  getPort() {
    return this.config.PORT; // number - fully typed
  }
}
```

## Schema Libraries

Any [Standard Schema](https://standardschema.dev/#what-schema-libraries-implement-the-spec) compatible library works. Tested with:

- [Zod](https://github.com/colinhacks/zod)
- [ArkType](https://github.com/arktypeio/arktype)

### ArkType Example

```typescript
import { configx } from "@abinnovision/nestjs-configx";
import { type } from "arktype";

export class AppConfigx extends configx(
  type({
    PORT: "string.numeric.parse = '3000'",
    HOST: "string = '0.0.0.0'",
  }),
) {}
```

## Error Handling

Invalid configuration throws `InvalidConfigError` at instantiation with details about which fields failed validation.
