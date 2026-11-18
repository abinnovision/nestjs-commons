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
- **ExceptionLocalizer**: Optional DI token to localize the user-facing `detail`
- **Entity-focused exceptions**: `EntityNotFoundException`, `EntityMutationFailedException`

## Package entry points

The package exposes two entry points:

- `@abinnovision/nestjs-exceptions`: base classes, the HTTP-aware interface, `MultiAppException`, `GenericExceptionFilter`, and `ExceptionLocalizer`.
- `@abinnovision/nestjs-exceptions/entity`: entity-focused exceptions and the `EntityRegistry` augmentation point.

## Quick Start

```typescript
import {
  EntityNotFoundException,
  EntityMutationFailedException,
} from "@abinnovision/nestjs-exceptions/entity";

throw new EntityNotFoundException({ entity: "user", entityId: "123" });
// details: "user with ID '123' not found"

throw new EntityMutationFailedException({
  entity: "user",
  entityId: "123",
  mutationType: "update",
});
// details: "Failed to update user with ID '123'"
```

`details` is the English developer message for logs. The response `detail`
equals `details` unless an `ExceptionLocalizer` is registered.

## Setup

### Register the exception filter

```typescript
// app.module.ts
import { APP_FILTER } from "@nestjs/core";
import { GenericExceptionFilter } from "@abinnovision/nestjs-exceptions";

@Module({
  providers: [{ provide: APP_FILTER, useClass: GenericExceptionFilter }],
})
export class AppModule {}
```

Or register it manually with `app.useGlobalFilters(new GenericExceptionFilter())`.

### Localize error messages (optional)

Provide an `ExceptionLocalizer` to render the user-facing `detail` (and the
GraphQL message) per request. The localizer receives the error `code`, the
fallback `detail`, the public `meta` and the original exception. Return
`undefined` to keep the fallback. If it throws, the filter logs a warning and
uses the fallback. The GraphQL message for multiple errors uses the code
`DEFAULT__MULTIPLE_ERRORS`.

```typescript
import {
  ExceptionLocalizer,
  GenericExceptionFilter,
  type LocalizableError,
} from "@abinnovision/nestjs-exceptions";

@Injectable()
export class MyExceptionLocalizer extends ExceptionLocalizer {
  public localize(error: LocalizableError, host: ArgumentsHost) {
    return translate(`exceptions.${error.code}`, error.meta);
  }
}

@Module({
  providers: [
    { provide: ExceptionLocalizer, useClass: MyExceptionLocalizer },
    { provide: APP_FILTER, useClass: GenericExceptionFilter },
  ],
})
export class AppModule {}
```

When registering the filter manually, pass the localizer:
`new GenericExceptionFilter(app.get(ExceptionLocalizer))`.

## Drizzle Type Augmentation

For type-safe entity names derived from your Drizzle schema, augment the
`EntityRegistry` interface exposed from `@abinnovision/nestjs-exceptions/entity`.
Once augmented, every entity-focused exception's `entity` field is automatically
narrowed, with no subclassing required.

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

### 3. Use the exceptions directly, `entity` is now type-checked

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
abstract class AppException<M extends object = EmptyMeta> extends Error {
  abstract readonly code: string;
  readonly details: string; // English developer message
  readonly meta: M; // public, `{}` when absent
  readonly cause?: Error;
  readonly sourcePointer?: string;

  constructor(details: string, opts?: AppExceptionOpts<M>);
}

type ExceptionCode<E extends AppExceptionClass>; // literal `code` of a class
type ExceptionMeta<E extends AppExceptionClass>; // `meta` type of a class
```

Declare `code` as `public readonly code = "NS__NAME"` to keep its literal type.
`meta` is serialized into the response and is the parameter source for
localized messages, so put only client-safe values in it.

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

Exception filter that handles both HTTP and GraphQL contexts. Optionally
injects an `ExceptionLocalizer`.

#### `ExceptionLocalizer`

Abstract class used as DI token. Implement `localize(error, host)`, which
returns the localized message or `undefined`.

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
  public readonly code = "VALIDATION__FAILED";
  public readonly httpStatus = 400;

  public constructor(field: string, constraint: string) {
    super(`Validation failed for field '${field}': ${constraint}`, {
      meta: { field, constraint },
    });
  }
}
```

The subclass constructor is the throw-site contract: required parameters are
enforced there.

Or extend `EntityFocusedAppException` for entity-related exceptions. Its
`meta` contains `entityName` and `entityId`:

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
  public readonly code = "COMMON__DUPLICATE";
  public readonly httpStatus = 409;

  public constructor(
    args: EntityFocusedArgs,
    opts?: AppExceptionOptsWithoutMeta,
  ) {
    super(
      args,
      `${args.entity} with ID '${args.entityId}' already exists`,
      opts,
    );
  }
}
```

## Migrating from 0.2

- The entity name renderer (`configureEntityNameRenderer`, `getEntityDisplayName`,
  `resetEntityNameRenderer`, `entityDisplayName`) is removed. `details` uses the
  raw entity name; localize display names through an `ExceptionLocalizer`.
- `EntityFocusedAppException` takes `(args, details, opts?)` instead of a
  message template function, and its constructor is protected.
- `meta` is always defined (`{}` when absent).
- Declare `code` as `public readonly code = "NS__NAME"`. A mutable or
  `string`-typed `code` compiles, but `ExceptionMessages` from
  `@abinnovision/nestjs-i18n` gives no coverage for it.
- Built-in codes are literal types. To use a different code, extend
  `EntityFocusedAppException` instead of overriding a built-in `code`.

## License

Apache-2.0
