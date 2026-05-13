# @abinnovision/nestjs-toolkit

Common helpers for NestJS apps, with [remeda](https://remedajs.com/) re-exported as `R`.

## Installation

```bash
yarn add @abinnovision/nestjs-toolkit
```

## Usage

The package exposes two surfaces:

- **Direct, data-first helpers** — `slugify(data, opts?)`, `sanitizeString(data, opts?)`, `generateUUID(...)`, `isUUID(...)`, `toUUID(...)`, `isNullishOrEmptyString(...)`, plus UUID namespace constants and types.
- **`R` namespace** — every function from `remeda` plus data-last / pipe-friendly variants of the helpers above: `R.slugify(opts?)`, `R.sanitizeString(opts?)`, `R.isUUID`, `R.isNullishOrEmptyString`.

```typescript
import { R, slugify, generateUUID, isUUID } from "@abinnovision/nestjs-toolkit";

slugify("Hello World!"); // "hello-world"

R.pipe("  <b>Hello World!</b>  ", R.sanitizeString(), R.slugify());
// "hello-world"

const id = generateUUID();
isUUID(id); // true
```

See the [remeda documentation](https://remedajs.com/docs/) for the full `R.*` surface, and the inline TSDoc for option shapes and UUID version overloads.

## License

Apache-2.0
