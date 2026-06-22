# @abinnovision/nestjs-healthz

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-healthz?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-healthz)

Self-mounting health check module for NestJS. Mounts Kubernetes-style `/livez`, `/readyz`, and `/healthz` endpoints, and discovers health attestors decorated across the application — no central registry, no per-module wiring.

## Installation

```bash
yarn add @abinnovision/nestjs-healthz
```

## Quick Start

### 1. Mount the module

```typescript
import { HealthzModule } from "@abinnovision/nestjs-healthz";

@Module({
  imports: [DatabaseModule, HealthzModule.forRoot()],
})
export class AppModule {}
```

`HealthzModule.forRoot()` is global — every module that loads into
the app graph is scanned for attestors.

### 2. Declare an attestor inside the module that owns the dependency

```typescript
import {
  HealthAttestor,
  type HealthCheckOutcome,
} from "@abinnovision/nestjs-healthz";

@HealthAttestor({ name: "database", critical: true })
export class DatabaseAttestor implements HealthAttestor {
  public constructor(private readonly db: DatabaseService) {}

  public async check(): Promise<HealthCheckOutcome> {
    await this.db.query("SELECT 1");
    return { status: "ok" };
  }
}
```

`@HealthAttestor()` applies `@Injectable()` internally — the same way
`@Controller()` and `@Resolver()` do — so no need to also write
`@Injectable()`. The class still needs to be registered as a provider:

```typescript
@Module({
  providers: [DatabaseService, DatabaseAttestor],
})
export class DatabaseModule {}
```

That's it. `/healthz`, `/readyz`, and `/livez` are live.

## Endpoints

| Path           | Behavior                                                         | Use case                                          |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `GET /livez`   | Returns `200 { status, timestamp }`. Runs **no** attestors.      | Kubernetes liveness probe — "process is alive".   |
| `GET /readyz`  | Runs every discovered attestor and returns the aggregate status. | Kubernetes readiness probe — "ready for traffic". |
| `GET /healthz` | Alias of `/readyz`.                                              | Canonical "is the application healthy?" name.     |

`/livez` intentionally runs no attestors so that a slow downstream
dependency cannot trigger pod restarts. Wire only `/readyz` (or
`/healthz`) to readiness checks that gate traffic.

## Status model

The aggregate status is three-state:

| Aggregate    | HTTP | Trigger                                                       |
| ------------ | ---- | ------------------------------------------------------------- |
| `"ok"`       | 200  | All attestors reported `ok`.                                  |
| `"degraded"` | 200  | Only **non-critical** attestors failed.                       |
| `"down"`     | 503  | At least one attestor with `critical: true` (default) failed. |

Each attestor declares whether it is critical:

```typescript
@HealthAttestor({ name: "queue-depth", critical: false })
```

Non-critical attestors are still reported, but their failure does not
take traffic away.

## Rate-limiting check execution

Each attestor may declare a minimum interval between actual
executions. There is no rate-limit by default — every request runs
every check.

```typescript
@HealthAttestor({
  name: "redis",
  minIntervalMs: 10_000,
})
```

The previous outcome — including a previous `down` outcome — is
reused for requests that arrive within `minIntervalMs` of the last
execution. The next request after the interval elapses triggers a
fresh check.

This is primarily a guard against probe traffic flooding the
underlying subsystem. `/readyz` is typically polled by liveness
controllers, load balancers, and dashboards in parallel; without
`minIntervalMs`, a misconfigured client can turn that into a steady
stream of `SELECT 1` queries against your database. The bound is
process-local — each replica enforces its own rate.

## Timeouts and thrown errors

`check()` is bounded by a per-attestor timeout (default 2000 ms). A
timed-out check is reported as `{ "status": "down" }`. Exceptions
thrown by `check()` are caught inside the runner and produce the same
outcome — no exception ever escapes the controller.

The underlying error message is logged via the NestJS logger for
operator diagnostics but is intentionally **not** included in the
probe response, so a misbehaving subsystem cannot leak internal error
text to whoever curls `/readyz`.

```typescript
@HealthAttestor({ name: "slow-api", timeoutMs: 5000 })
```

## Response shape

```json
{
  "status": "ok",
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "durationMs": 12
    },
    {
      "name": "redis",
      "status": "down",
      "durationMs": 2003
    }
  ],
  "timestamp": "2026-05-13T12:34:56.000Z"
}
```

The HTTP status code is `503` when the aggregate status is `"down"`
and `200` otherwise.

## API Reference

### `HealthzModule.forRoot()`

Registers the module globally and mounts the three endpoints. Takes
no arguments today; reserved as the canonical entry point for any
future module configuration.

```typescript
HealthzModule.forRoot();
```

### `@HealthAttestor(options)`

Marks a class as a health attestor. The class must implement `check()`
returning `HealthCheckOutcome` (sync or async). Internally applies
`@Injectable()`.

```typescript
interface HealthAttestorOptions {
  name: string;
  critical?: boolean; // default true
  minIntervalMs?: number; // when set, check runs at most once per interval
  timeoutMs?: number; // default 2000
}
```

### `HealthAttestor` (interface)

The contract every attestor must satisfy. Shares its name with the
decorator function — TypeScript's separate value and type namespaces
let `@HealthAttestor(...)` and `implements HealthAttestor` coexist.

```typescript
interface HealthAttestor {
  check(): Promise<HealthCheckOutcome> | HealthCheckOutcome;
}
```

### `HealthCheckOutcome`

```typescript
interface HealthCheckOutcome {
  status: "ok" | "down";
  details?: Record<string, string>;
}
```

`details` is surfaced under `checks[].details` in the response —
useful for small, safe-to-publish diagnostics (e.g.
`{ "lag_seconds": "12" }`). Values are restricted to strings so the
response stays predictable and no caller can accidentally publish
unbounded objects or sensitive fields.

## License

Apache-2.0
