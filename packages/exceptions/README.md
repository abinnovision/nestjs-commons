# @abinnovision/nestjs-exceptions

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-exceptions?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-exceptions)

NestJS exception handling with entity-focused exceptions and GraphQL support.

## Installation

```bash
yarn add @abinnovision/nestjs-exceptions
```

## Features

- **AppException**: Transport-agnostic base exception class with typed metadata support
- **HttpAwareException**: Opt-in interface for HTTP status codes and headers
- **MultiAppException**: Wrapper for multiple exceptions
- **GenericExceptionFilter**: Unified error handling for HTTP and GraphQL
- **Entity-focused exceptions**: `EntityNotFoundException`, `EntityMutationFailedException` with configurable entity display names

## Package entry points

The package exposes two entry points:

- `@abinnovision/nestjs-exceptions` — base classes, the HTTP-aware interface, `MultiAppException`, and `GenericExceptionFilter`.
- `@abinnovision/nestjs-exceptions/entity` — entity-focused exceptions, the `EntityRegistry` augmentation point, and the entity name renderer helpers.

## Quick Start

```typescript
import { GenericExceptionFilter } from "@abinnovision/nestjs-exceptions";
import {
  EntityNotFoundException,
  EntityMutationFailedException,
  configureEntityNameRenderer,
} from "@abinnovision/nestjs-exceptions/entity";

/**
 * Configure entity display names at app startup.
 */
configureEntityNameRenderer({
  user: "User",
  organization: "Organization",
  user_profile: "User profile",
});

throw new EntityNotFoundException({ entity: "user", entityId: "123" });
// Error message: "User with ID '123' not found"

throw new EntityMutationFailedException({
  entity: "user",
  entityId: "123",
  mutationType: "update",
});
// Error message: "Failed to update User with ID '123'"
```

## Setup

### 1. Configure the global entity name renderer at app startup

```typescript
// main.ts (or app.module.ts constructor)
import { configureEntityNameRenderer } from "@abinnovision/nestjs-exceptions/entity";

configureEntityNameRenderer({
  user: "User",
  organization: "Organization",
  user_profile: "User profile",
});
```

### 2. Register the exception filter

```typescript
// main.ts
import { GenericExceptionFilter } from "@abinnovision/nestjs-exceptions";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GenericExceptionFilter());
  await app.listen(3000);
}
```

## Drizzle Type Augmentation

For type-safe entity names derived from your Drizzle schema, augment the
`EntityRegistry` interface exposed from `@abinnovision/nestjs-exceptions/entity`.
Once augmented, every entity-focused exception's `entity` field is automatically
narrowed — no subclassing required.

### 1. Derive an `EntityName` union from your Drizzle schema

```typescript
// src/common/exceptions/entity-types.ts
import type { Table } from "drizzle-orm";
import type { db } from "../../database";

type GetTableName<T> = T extends Table<infer C> ? C["name"] : never;
type TableKeys<T> = {
  [K in keyof T]: T[K] extends Table ? K : never;
}[keyof T];

/**
 * Union of all entity names derived from Drizzle schema.
 */
export type EntityName = GetTableName<(typeof db)[TableKeys<typeof db>]>;
```

### 2. Register the union with `EntityRegistry`

```typescript
// src/common/exceptions/entity-registry.ts
import type { EntityName } from "./entity-types";

declare module "@abinnovision/nestjs-exceptions/entity" {
  interface EntityRegistry {
    entities: EntityName;
  }
}
```

### 3. Use the exceptions directly — `entity` is now type-checked

```typescript
import { EntityNotFoundException } from "@abinnovision/nestjs-exceptions/entity";

throw new EntityNotFoundException({ entity: "user", entityId: id }); // OK
throw new EntityNotFoundException({ entity: "invalid", entityId: id }); // Type error!
```

## API Reference

### Core Classes

#### `AppException<M>`

Abstract, transport-agnostic base class for all application exceptions.

```typescript
abstract class AppException<M = unknown> extends Error {
  abstract code: string;
  readonly details: string;
  readonly meta?: M;
  readonly cause?: Error;
  readonly sourcePointer?: string;
}
```

#### `HttpAwareException`

Interface implemented by exceptions that carry HTTP-specific information.
Implement this on `AppException` subclasses that should influence HTTP
response status codes and headers.

```typescript
interface HttpAwareException {
  readonly httpStatus: number;
  readonly headers?: Record<string, string>;
}

function isHttpAwareException(value: unknown): value is HttpAwareException;
```

#### `MultiAppException`

Wrapper for multiple exceptions.

```typescript
import { MultiAppException } from "@abinnovision/nestjs-exceptions";
import { EntityNotFoundException } from "@abinnovision/nestjs-exceptions/entity";

const errors = new MultiAppException([
  new EntityNotFoundException({ entity: "user", entityId: "1" }),
  new EntityNotFoundException({ entity: "user", entityId: "2" }),
]);
```

#### `GenericExceptionFilter`

Exception filter that handles both HTTP and GraphQL contexts.

### Entity-Focused Exceptions

All symbols below are imported from `@abinnovision/nestjs-exceptions/entity`.

#### `EntityNotFoundException`

Thrown when an entity is not found.

```typescript
throw new EntityNotFoundException({ entity: "user", entityId: "123" });
// Code: COMMON__NOT_FOUND
// HTTP Status: 404
```

#### `EntityMutationFailedException`

Thrown when a create/update/delete operation fails.

```typescript
throw new EntityMutationFailedException({
  entity: "user",
  entityId: "123",
  mutationType: "update", // 'create' | 'update' | 'delete'
});
// Code: COMMON__MUTATION_FAILED
// HTTP Status: 400
```

### Entity Name Renderer

#### `configureEntityNameRenderer(displayNames)`

Configure the global entity name renderer. Call once at app startup.
Accepts a `Record<EntityName, string>` mapping entity names to display names.

#### `getEntityDisplayName(entity)`

Get the display name for an entity using the global renderer. Falls back to
the raw entity name when no mapping is configured.

#### `resetEntityNameRenderer()`

Reset to the default (empty) renderer. Useful for testing.

## Creating Custom Exceptions

Extend `AppException` for custom exceptions. Opt into HTTP semantics by
implementing `HttpAwareException`:

```typescript
import {
  AppException,
  type HttpAwareException,
} from "@abinnovision/nestjs-exceptions";

interface ValidationMeta {
  field: string;
  constraint: string;
}

export class ValidationException
  extends AppException<ValidationMeta>
  implements HttpAwareException
{
  public override code = "VALIDATION__FAILED";
  public readonly httpStatus = 400;

  public constructor(field: string, constraint: string) {
    super(`Validation failed for field '${field}': ${constraint}`, {
      meta: { field, constraint },
    });
  }
}
```

Or extend `EntityFocusedAppException` for entity-related exceptions:

```typescript
import { type HttpAwareException } from "@abinnovision/nestjs-exceptions";
import {
  EntityFocusedAppException,
  type EntityFocusedArgs,
} from "@abinnovision/nestjs-exceptions/entity";

import type { AppExceptionOptsWithoutMeta } from "@abinnovision/nestjs-exceptions";

export class DuplicateEntityException
  extends EntityFocusedAppException
  implements HttpAwareException
{
  public override code = "COMMON__DUPLICATE";
  public readonly httpStatus = 409;

  public constructor(
    args: EntityFocusedArgs,
    opts?: AppExceptionOptsWithoutMeta,
  ) {
    super(
      args,
      (displayName, entityId) =>
        `${displayName} with ID '${entityId}' already exists`,
      opts,
    );
  }
}
```

## License

Apache-2.0
