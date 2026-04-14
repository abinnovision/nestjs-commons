# @abinnovision/nestjs-toolkit

NestJS toolkit with remeda utilities and common helpers.

## Installation

```bash
npm install @abinnovision/nestjs-toolkit
# or
yarn add @abinnovision/nestjs-toolkit
```

## Features

- **Remeda as R**: Re-exports [remeda](https://remedajs.com/) as `R` for convenient functional utilities
- **String utilities**: Pipe-compatible `slugify` and `sanitizeString` functions
- **UUID utilities**: Simple `isUuid` and `generateUuid` helpers

## Usage

```typescript
import {
  R,
  slugify,
  sanitizeString,
  isUuid,
  generateUuid,
} from "@abinnovision/nestjs-toolkit";

// Use remeda utilities via R
const doubled = R.pipe(
  [1, 2, 3],
  R.map((x) => x * 2),
);

// String utilities (pipe-compatible)
const slug = slugify("Hello World!"); // "hello-world"
const slugInPipe = R.pipe("Hello World!", slugify()); // "hello-world"

// With options
const customSlug = slugify("Hello World!", { maxLength: 5, separator: "_" }); // "hello"

// Sanitize strings
const clean = sanitizeString("  <script>alert('xss')</script>Hello  ");

// UUID utilities
const id = generateUuid();
const valid = isUuid(id); // true
```

## API

### Remeda (`R`)

Full re-export of [remeda](https://remedajs.com/). See the [remeda documentation](https://remedajs.com/docs/) for all available functions.

### String Utilities

#### `slugify(data, options?)` / `slugify(options?)`

Convert a string to a URL-safe slug. Pipe-compatible with remeda.

**Options:**

- `maxLength?: number` - Maximum length of the slug (default: 100)
- `separator?: string` - Separator character (default: "-")

#### `sanitizeString(data, options?)` / `sanitizeString(options?)`

Sanitize a string by removing HTML and normalizing Unicode. Pipe-compatible with remeda.

**Options:**

- `trim?: boolean` - Trim whitespace (default: true)

#### `isNullishOrEmptyString(value)`

Type guard that returns true if the value is null, undefined, or an empty string.

### UUID Utilities

#### `generateUuid()`

Generate a new UUIDv4 string.

#### `isUuid(value)`

Type guard that returns true if the value is a valid UUID string.

## License

Apache-2.0
