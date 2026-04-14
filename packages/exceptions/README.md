# @abinnovision/nestjs-exceptions

NestJS exception handling with entity-focused exceptions and GraphQL support.

## Installation

```bash
npm install @abinnovision/nestjs-exceptions
# or
yarn add @abinnovision/nestjs-exceptions
```

## Features

- **AppException**: Base exception class with typed metadata support
- **MultiAppException**: Wrapper for multiple exceptions
- **GenericExceptionFilter**: Unified error handling for HTTP and GraphQL
- **Entity-focused exceptions**: `NotFoundException`, `MutationFailedException` with configurable entity display names

## Quick Start

```typescript
import {
  NotFoundException,
  MutationFailedException,
  configureEntityNameRenderer,
  createEntityNameRenderer,
  GenericExceptionFilter,
} from "@abinnovision/nestjs-exceptions";

// Configure entity display names at app startup
configureEntityNameRenderer(
  createEntityNameRenderer({
    user: "User",
    organization: "Organization",
    user_profile: "User profile",
  }),
);

// Use in services
throw new NotFoundException({ entity: "user", entityId: "123" });
// Error message: "User with ID '123' not found"

throw new MutationFailedException({
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
import {
  configureEntityNameRenderer,
  createEntityNameRenderer,
} from "@abinnovision/nestjs-exceptions";

configureEntityNameRenderer(
  createEntityNameRenderer({
    user: "User",
    organization: "Organization",
    user_profile: "User profile",
  }),
);
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

For type-safe entity names derived from your Drizzle schema:

### 1. Create Drizzle-derived entity types

```typescript
// src/common/exceptions/entity-types.ts
import type { db } from "../../database";
import type { Table } from "drizzle-orm";

type GetTableName<T> = T extends Table<infer C> ? C["name"] : never;
type TableKeys<T> = {
  [K in keyof T]: T[K] extends Table ? K : never;
}[keyof T];

/**
 * Union of all entity names derived from Drizzle schema.
 * Provides type-safety when throwing entity-focused exceptions.
 */
export type EntityName = GetTableName<(typeof db)[TableKeys<typeof db>]>;
```

### 2. Create type-safe wrappers

```typescript
// src/common/exceptions/not-found.exception.ts
import { NotFoundException as BaseNotFoundException } from "@abinnovision/nestjs-exceptions";
import type { EntityName } from "./entity-types";

export class NotFoundException extends BaseNotFoundException<EntityName> {}

// Usage - entity is now type-checked against your Drizzle schema
throw new NotFoundException({ entity: "user", entityId: id }); // OK
throw new NotFoundException({ entity: "invalid", entityId: id }); // Type error!
```

## API

### Core Classes

#### `AppException<M>`

Abstract base class for all application exceptions.

```typescript
abstract class AppException<M = unknown> extends Error {
  abstract code: string;
  abstract httpStatus: number;
  readonly meta?: M;
  readonly cause?: Error;
  readonly sourcePointer?: string;
}
```

#### `MultiAppException`

Wrapper for multiple exceptions.

```typescript
const errors = new MultiAppException([
  new NotFoundException({ entity: "user", entityId: "1" }),
  new NotFoundException({ entity: "user", entityId: "2" }),
]);
```

#### `GenericExceptionFilter`

Exception filter that handles both HTTP and GraphQL contexts.

### Entity-Focused Exceptions

#### `NotFoundException<T>`

Thrown when an entity is not found.

```typescript
throw new NotFoundException({ entity: "user", entityId: "123" });
// Code: COMMON__NOT_FOUND
// HTTP Status: 404
```

#### `MutationFailedException<T>`

Thrown when a create/update/delete operation fails.

```typescript
throw new MutationFailedException({
  entity: "user",
  entityId: "123",
  mutationType: "update", // 'create' | 'update' | 'delete'
});
// Code: COMMON__MUTATION_FAILED
// HTTP Status: 400
```

### Entity Name Renderer

#### `configureEntityNameRenderer(renderer)`

Configure the global entity name renderer. Call once at app startup.

#### `createEntityNameRenderer(displayNames)`

Create a renderer from a record of display names.

#### `getEntityDisplayName(entity)`

Get the display name for an entity using the global renderer.

#### `resetEntityNameRenderer()`

Reset to default renderer (useful for testing).

## Creating Custom Exceptions

Extend `AppException` for custom exceptions:

```typescript
import { AppException } from "@abinnovision/nestjs-exceptions";

interface ValidationMeta {
  field: string;
  constraint: string;
}

export class ValidationException extends AppException<ValidationMeta> {
  public override code = "VALIDATION__FAILED";
  public override httpStatus = 400;

  constructor(field: string, constraint: string) {
    super(`Validation failed for field '${field}': ${constraint}`, {
      meta: { field, constraint },
    });
  }
}
```

Or extend `EntityFocusedAppException` for entity-related exceptions:

```typescript
import { EntityFocusedAppException } from "@abinnovision/nestjs-exceptions";

export class DuplicateEntityException<
  T extends string = string,
> extends EntityFocusedAppException<T> {
  public override code = "COMMON__DUPLICATE";
  public override httpStatus = 409;

  constructor(args: { entity: T; entityId: string }) {
    super(
      args,
      (displayName, entityId) =>
        `${displayName} with ID '${entityId}' already exists`,
    );
  }
}
```

## License

Apache-2.0
