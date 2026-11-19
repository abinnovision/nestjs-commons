# @abinnovision/nestjs-i18n

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-i18n?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-i18n)

Type-safe backend i18n for NestJS. Messages use [ICU MessageFormat](https://formatjs.github.io/docs/core-concepts/icu-syntax) and are formatted with [`intl-messageformat`](https://formatjs.github.io/docs/intl-messageformat). Keys and parameters are inferred from the default-locale catalog.

## Installation

```bash
yarn add @abinnovision/nestjs-i18n
```

## Quick Start

### 1. Define the catalogs

```typescript
// i18n/en.ts
import { defineCatalog } from "@abinnovision/nestjs-i18n";

export const en = defineCatalog({
  greeting: "Hello {name}",
  items: "{count, plural, one {# item} other {# items}}",
});
```

Other locales can be plain objects or JSON files with the same keys.

### 2. Register the catalog type

```typescript
declare module "@abinnovision/nestjs-i18n" {
  interface I18nRegistry {
    catalog: typeof en;
    locales: "en" | "de";
  }
}
```

### 3. Register the module

```typescript
import {
  I18nModule,
  acceptLanguage,
  fromRequest,
  queryParam,
} from "@abinnovision/nestjs-i18n";

@Module({
  imports: [
    I18nModule.forRoot({
      defaultLocale: "en",
      catalogs: { en, de },
      resolvers: [
        queryParam("lang"),
        fromRequest((req) => req.user?.locale),
        acceptLanguage(),
      ],
    }),
  ],
})
export class AppModule {}
```

`forRootAsync({ inject, useFactory })` is available as well. The module throws at startup when `defaultLocale` has no catalog.

`I18nModule` shares its name with the NestJS i18n packages. Alias the import (`import { I18nModule as NestI18nModule }`) or name your own module differently, e.g. `LocalizationModule`.

### 4. Translate

```typescript
@Injectable()
export class GreetingService {
  public constructor(private readonly i18n: I18nService) {}

  public greet(name: string): string {
    return this.i18n.t("greeting", { name });
  }
}
```

The locale is taken from `opts.locale`, then from `i18n.run(locale, fn)`, then resolved from the current request, then `defaultLocale`. An explicit locale is matched against the catalogs like a request locale (`de-AT` uses `de`). It is resolved on every call, so a `req.user` set by a guard is picked up. A key missing in a locale falls back to the default locale.

Set `middleware: false` to disable the request context middleware. Then only an explicit `locale` and `run()` apply.

### Handlers outside Nest

Handlers registered on the raw HTTP adapter (e.g. better-auth) run outside the middleware, whether or not `middleware: false` is set. Wrap them with `runForRequest`:

```typescript
const i18n = app.get(I18nService);
app.use((req, _res, next) => i18n.runForRequest(req, next));
```

Register it before those handlers. `app.get(I18nService)` works because the module is global. The locale is still resolved from the request on every call. Callbacks from streams or `EventEmitter`s can lose the async context, same as with the middleware.

## Localized exceptions

With `@abinnovision/nestjs-exceptions`, the `./exceptions` subpath localizes the `detail` of error responses with the `exceptions.<CODE>` messages. The exception `meta` is used as message parameters. Entity-focused exceptions also get an `entity` parameter from the `entities.<name>` message, or the raw entity name.

```typescript
import {
  ExceptionLocalizer,
  GenericExceptionFilter,
} from "@abinnovision/nestjs-exceptions";
import {
  I18nExceptionLocalizer,
  defaultExceptionMessages,
} from "@abinnovision/nestjs-i18n/exceptions";

import type { ExceptionMessages } from "@abinnovision/nestjs-i18n/exceptions";

export const en = defineCatalog({
  ...defaultExceptionMessages,
  "exceptions.USER__EMAIL_TAKEN": "Email ''{email}'' is already taken",
  "entities.user": "User",
}) satisfies ExceptionMessages<typeof EmailTakenException>;

@Module({
  providers: [
    { provide: ExceptionLocalizer, useClass: I18nExceptionLocalizer },
    { provide: APP_FILTER, useClass: GenericExceptionFilter },
  ],
})
export class AppModule {}
```

Codes without a message keep the English `details`.

### Exception coverage

`ExceptionsOf` turns the exports of a module into the union of its exception classes, so a new class is covered once it is exported:

```typescript
import type * as userExceptions from "./user.exceptions.js";

export const en = defineCatalog({
  ...defaultExceptionMessages,
  "exceptions.USER__EMAIL_TAKEN": "Email ''{email}'' is already taken",
}) satisfies ExceptionMessages<ExceptionsOf<typeof userExceptions>>;
```

Only exported exception classes with a literal `code` count. Non-exception exports and bases with a wide `code: string` are excluded.

### Entity messages

`EntityMessages` requires an `entities.<name>` message per entity name. Combine it with `ExceptionMessages` using `&`:

```typescript
export const en = defineCatalog({
  ...defaultExceptionMessages,
  "entities.user": "User",
}) satisfies ExceptionMessages<ExceptionsOf<typeof userExceptions>> &
  EntityMessages;
```

It checks nothing until `EntityRegistry` is augmented. Use `EntityMessages<"user" | "org">` to name the entities explicitly.

## Testing

```typescript
import { verifyCatalogs } from "@abinnovision/nestjs-i18n";

it("has complete catalogs", () => {
  expect(verifyCatalogs({ en, de }, "en")).toEqual([]);
});
```

Missing messages: `CatalogShape` enforces keys only when `I18nRegistry` is augmented and the catalogs are not cast. `verifyCatalogs` covers the rest in tests. At runtime, a fallback from a non-default locale is logged at debug level, which is visible when debug logging is enabled (the default with Nest's `ConsoleLogger`).

`verifyCatalogs` reports missing keys, extra keys, messages that fail to parse, and arguments that the default-locale message does not have (for example a `{nmae}` typo).
