# abinnovision/nestjs-commons

[![Build](https://github.com/abinnovision/nestjs-commons/actions/workflows/build.yaml/badge.svg)](https://github.com/abinnovision/nestjs-commons/actions/workflows/build.yaml)

A collection of common packages for NestJS.

## Packages

| Package                                             | Version                                                                                                                                           | Description                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`@abinnovision/nestjs-configx`](/packages/configx) | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-configx?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-configx) | Simple configuration management for NestJS, supporting Standard Schema. |
| [`@abinnovision/nestjs-hatchet`](/packages/hatchet) | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-hatchet?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-hatchet) | NestJS integration for Hatchet workflow orchestration.                  |

See each package README for installation and usage instructions.

### Examples

| Example                                                | Description                                       |
| ------------------------------------------------------ | ------------------------------------------------- |
| [`configuration`](/examples/configuration)             | Usage example for `@abinnovision/nestjs-configx`. |
| [`hatchet-integration`](/examples/hatchet-integration) | Usage example for `@abinnovision/nestjs-hatchet`. |

## Development

Yarn 4 monorepo with [Turbo](https://turbo.build/).

### Prerequisites

- Node.js 24+ (see [`.tool-versions`](.tool-versions))
- [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`)
- Docker (for hatchet integration tests)

### Setup

```bash
yarn install
```

For hatchet integration tests, copy the example env file and start the required services:

```bash
cp .env.example .env
docker compose up -d
```

### Commands

```bash
yarn build          # Build all packages
yarn check          # Lint + format checks
yarn fix            # Auto-fix lint/format
yarn test           # Run all tests
yarn test-unit      # Run unit tests only
```

## License

Apache-2.0
