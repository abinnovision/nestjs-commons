# @abinnovision/nestjs-toolkit

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-toolkit?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-toolkit)

Common helpers for NestJS apps, with [remeda](https://remedajs.com/) re-exported as `R`.

## Installation

```bash
yarn add @abinnovision/nestjs-toolkit
```

## Usage

The package exposes two surfaces:

- **Direct helpers** — string, UUID, async, equality, and assertion helpers, imported and called directly.
- **`R` namespace** — every function from `remeda`, plus pipe-friendly variants of selected helpers for use in `R.pipe(...)`.

```typescript
import { R, slugify, generateUUID, isUUID } from "@abinnovision/nestjs-toolkit";

slugify("Hello World!"); // "hello-world"

R.pipe("  <b>Hello World!</b>  ", R.sanitizeString(), R.slugify());
// "hello-world"

const id = generateUUID();
isUUID(id); // true
```

See the [remeda documentation](https://remedajs.com/docs/) for the full `R.*` surface, and the inline TSDoc for the complete helper catalog, option shapes, and UUID version overloads.

## License

Apache-2.0
