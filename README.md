# abinnovision/nestjs-commons

[![Build](https://github.com/abinnovision/nestjs-commons/actions/workflows/build.yaml/badge.svg)](https://github.com/abinnovision/nestjs-commons/actions/workflows/build.yaml)

A collection of common packages for NestJS.

## Packages

| Package                                                   | Version                                                                                                                                                 | Description                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`@abinnovision/nestjs-configx`](/packages/configx)       | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-configx?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-configx)       | Simple configuration management for NestJS, supporting Standard Schema.                                                                |
| [`@abinnovision/nestjs-exceptions`](/packages/exceptions) | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-exceptions?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-exceptions) | Standardized NestJS exception handling with entity-focused exceptions, HTTP awareness, and built-in support for GraphQL and REST APIs. |
| [`@abinnovision/nestjs-flydrive`](/packages/flydrive)     | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-flydrive?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-flydrive)     | NestJS integration for flydrive with class-token disks, eager fail-fast startup, and a fakes API for tests.                            |
| [`@abinnovision/nestjs-hatchet`](/packages/hatchet)       | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-hatchet?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-hatchet)       | NestJS integration for Hatchet workflow orchestration.                                                                                 |
| [`@abinnovision/nestjs-healthz`](/packages/healthz)       | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-healthz?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-healthz)       | Self-mounting health check module with cross-module attestor discovery and Kubernetes-style probes.                                    |
| [`@abinnovision/nestjs-toolkit`](/packages/toolkit)       | [![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-toolkit?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-toolkit)       | NestJS utility library providing Remeda functional helpers, string manipulation, and UUID operations for common development tasks.     |

See each package README for installation and usage instructions.

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
