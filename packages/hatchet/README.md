# @abinnovision/nestjs-hatchet

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-hatchet?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-hatchet)

NestJS integration for [Hatchet](https://hatchet.run) - a distributed workflow orchestration engine. Provides type-safe decorators, services, and event handling for building robust workflows.

## Installation

```bash
yarn add @abinnovision/nestjs-hatchet @hatchet-dev/typescript-sdk
```

`@hatchet-dev/typescript-sdk` is a peer dependency, so your application controls the SDK
version. Import SDK types such as `Context` directly from it.

## Quick Start

### 1. Configure Module

```typescript
import { HatchetModule } from "@abinnovision/nestjs-hatchet";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    HatchetModule.forRoot({
      config: {
        token: process.env.HATCHET_CLIENT_TOKEN,
        tls_config: { tls_strategy: "none" },
      },
      worker: { name: "my-worker" },
    }),
  ],
})
export class AppModule {}
```

The worker is stopped through Nest's shutdown hooks, waiting for running tasks to
finish. Call `app.enableShutdownHooks()` so this also happens on `SIGTERM`/`SIGINT`.
To let the Hatchet SDK handle these signals itself instead, set `handleKill: true` in
the worker options.

### 2. Define a Task

```typescript
import { Host, Task, TaskCtx, taskHost } from "@abinnovision/nestjs-hatchet";
import { z } from "zod";

@Host({ name: "process-data" })
export class ProcessDataTask extends taskHost(z.object({ data: z.string() })) {
  @Task({})
  public async task(ctx: TaskCtx<typeof this>) {
    return { result: ctx.input.data.toUpperCase() };
  }
}
```

### 3. Register and Invoke

```typescript
import { Client, HatchetModule, taskRef } from "@abinnovision/nestjs-hatchet";
import { Injectable, Module } from "@nestjs/common";

import { ProcessDataTask } from "./process-data.task";

@Injectable()
export class MyService {
  constructor(private readonly client: Client) {}

  async process(data: string) {
    return this.client.run(taskRef(ProcessDataTask), { data });
  }
}

@Module({
  imports: [HatchetModule.forFeature(taskRef(ProcessDataTask))],
  providers: [ProcessDataTask, MyService],
})
export class ProcessDataModule {}
```

`forFeature()` only registers the hosts with the worker. Each host must also be listed
in the `providers` of a module, otherwise the worker cannot resolve it and the
application fails to start.

## Core Concepts

### Tasks

Standalone units of work with a single executable method.

```typescript
@Host({ name: "cleanup" })
export class CleanupTask extends taskHost() {
  @Task({})
  public async task(ctx: TaskCtx<typeof this>) {
    return { cleaned: true };
  }
}
```

### Workflows

Multi-step processes with task dependencies.

```typescript
@Host({ name: "order-workflow" })
export class OrderWorkflow extends workflowHost(
  z.object({ orderId: z.string() }),
) {
  @WorkflowTask<typeof OrderWorkflow>({ parents: [] })
  public async validate(ctx: WorkflowCtx<typeof this>) {
    return { valid: true };
  }

  @WorkflowTask<typeof OrderWorkflow>({ parents: ["validate"] })
  public async process(ctx: WorkflowCtx<typeof this>) {
    const validation = await ctx.parent(this.validate);
    return { processed: validation.valid };
  }
}
```

### Events

Type-safe event definitions with schema validation.

```typescript
// Define event
export const UserCreatedEvent = defineEvent(
  "user:created",
  z.object({ userId: z.string(), email: z.string().email() }),
);

// Workflow triggered by event
@Host({ name: "user-handler", onEvents: ["user:created"] })
export class UserHandlerWorkflow extends workflowHost() {
  @WorkflowTask<typeof UserHandlerWorkflow>({ parents: [] })
  public async handle(ctx: WorkflowCtx<typeof this>) {
    if (UserCreatedEvent.isCtx(ctx)) {
      return { userId: ctx.input.userId };
    }
  }
}

// Emit event
await client.emit(UserCreatedEvent, {
  userId: "123",
  email: "user@example.com",
});
```

## Advanced Usage

### Non-Blocking Execution

```typescript
const runRef = await ctx.run(taskRef(SomeTask), input, { wait: false });
// Continue without waiting...
const result = await runRef.output; // Await when needed
```

### Bulk Event Emission

```typescript
await client.emit(OrderEvent, [
  { orderId: "1", total: 100 },
  { orderId: "2", total: 200 },
]);
```

### Task interceptors

Task interceptors wrap every task execution on the worker, including each task of a workflow, e.g. for
logging or tracing. Pass them to `forRoot()`/`forRootAsync()` and list them as providers, since they are
resolved from the application rather than instantiated by the module. For producer-side
calls, see [Client interceptors](#client-interceptors).

```typescript
import {
  BaseCtx,
  HatchetModule,
  TaskInterceptor,
} from "@abinnovision/nestjs-hatchet";
import { Injectable, Logger, Module } from "@nestjs/common";

@Injectable()
export class LoggingInterceptor extends TaskInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  public async intercept<T>(ctx: BaseCtx<any>, next: () => Promise<T>) {
    this.logger.log(`Running ${ctx.fromSDK.taskName()}`);
    return next();
  }
}

@Module({
  imports: [
    HatchetModule.forRoot({
      config: {},
      worker: { name: "my-worker" },
      taskInterceptors: [LoggingInterceptor],
    }),
  ],
  providers: [LoggingInterceptor],
})
export class AppModule {}
```

### Client interceptors

Client interceptors wrap producer-side calls on `Client`: `client.emit` (and the
deprecated `emitBulk`) and `client.run`. Extend `ClientInterceptor` and implement
`interceptEmit`, `interceptRun`, or both. Register the class with the
`clientInterceptors` option of `forRoot()`/`forRootAsync()` and list it in `providers`.

The example below propagates a correlation id. The client interceptor writes it into
`additionalMetadata`, and a task interceptor on the worker restores it from the
metadata of the running task.

```typescript
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import {
  BaseCtx,
  ClientInterceptor,
  EmitCtx,
  EmitOptions,
  HatchetModule,
  TaskInterceptor,
  RunCtx,
  RunOptions,
} from "@abinnovision/nestjs-hatchet";
import { Injectable, Module } from "@nestjs/common";

export const correlation = new AsyncLocalStorage<{ id: string }>();

@Injectable()
export class CorrelationClientInterceptor extends ClientInterceptor {
  public override async interceptEmit(
    ctx: EmitCtx,
    next: (options?: EmitOptions) => Promise<unknown>,
  ) {
    const id = correlation.getStore()?.id;
    if (!id) return next();

    return next({
      ...ctx.options,
      additionalMetadata: {
        correlationId: id,
        ...ctx.options?.additionalMetadata,
      },
    });
  }

  public override async interceptRun(
    ctx: RunCtx,
    next: (options?: RunOptions) => Promise<unknown>,
  ) {
    const id = correlation.getStore()?.id;
    if (!id) return next();

    return next({
      ...ctx.options,
      additionalMetadata: {
        correlationId: id,
        ...ctx.options?.additionalMetadata,
      },
    });
  }
}

@Injectable()
export class CorrelationInterceptor extends TaskInterceptor {
  public async intercept<T>(ctx: BaseCtx<any>, next: () => Promise<T>) {
    const id = ctx.fromSDK.additionalMetadata()?.correlationId ?? randomUUID();
    return correlation.run({ id }, next);
  }
}

@Module({
  imports: [
    HatchetModule.forRootAsync({
      useFactory: () => ({ config: {}, worker: { name: "my-worker" } }),
      clientInterceptors: [CorrelationClientInterceptor],
      taskInterceptors: [CorrelationInterceptor],
    }),
  ],
  providers: [CorrelationClientInterceptor, CorrelationInterceptor],
})
export class AppModule {}
```

Behavior:

- Each interceptor runs once per call. A bulk emit (array payload) and a `run` with
  array input each count as one call.
- Interceptors change options only. The payload or input is not modifiable.
- `next()` keeps the current options. `next(options)` replaces them for the following
  interceptors and the SDK call, so spread `ctx.options` to keep caller values.
- `next(undefined)` behaves like `next()`. To drop all options, pass `{}`.
- `wait` and the return shape of `client.run` cannot be overridden. `RunOptions`
  excludes `wait`.
- With `wait: true` (the default), `interceptRun` wraps the full run, including
  awaiting the output. With `wait: false` it wraps only the enqueue.
- `childKey` has no effect on `Client.run`.
- Interceptors run in array order, the first being the outermost. An interceptor may
  skip `next()` to short-circuit the call.
- Client interceptor classes must be listed in `providers`. A missing provider fails
  application bootstrap.
- Child runs started with `ctx.run` inherit the parent's `additionalMetadata` on
  Hatchet engine `>= v0.104.0`, so they need no client interceptor.

Caveats:

- Calling `client.emit` or `client.run` inside an interceptor re-enters the chain.
  Guard against the recursion yourself.
- Request-scoped interceptor providers are not supported, same as task
  interceptors.

### Helper Methods

```typescript
@Host({ name: "my-task" })
export class MyTask extends taskHost(schema) {
  @Task({})
  public async task(ctx: TaskCtx<typeof this>) {
    return this.helper(ctx);
  }

  private async helper(ctx: HelperCtx<typeof this>) {
    return { result: ctx.input.value };
  }
}
```

## Durable Tasks

Durable tasks are backed by Hatchet's durable execution. Waits, sleeps and child runs are recorded in a
durable event log, so a durable task can be evicted from the worker and resumed later without repeating
recorded work.

Use `@DurableTask()` on a task host and `@DurableWorkflowTask()` on a workflow host. The method must take a
`DurableTaskCtx` or `DurableWorkflowCtx`; any other context type is rejected at compile time. Durable and
non-durable tasks can be mixed in one workflow and can be each other's `parents`.

```typescript
@Host({ name: "order-fulfillment" })
export class OrderFulfillmentTask extends taskHost(
  z.object({ orderId: z.string() }),
) {
  @DurableTask({ executionTimeout: "1h" })
  public async task(ctx: DurableTaskCtx<typeof this>) {
    const payment = await ctx.run(taskRef(ChargePaymentTask), {
      orderId: ctx.input.orderId,
    });

    await ctx.sleepFor("10m");

    const shipped = await ctx.waitForEvent(OrderShippedEvent, {
      expression: `input.orderId == '${ctx.input.orderId}'`,
    });

    return { paymentId: payment.paymentId, trackingId: shipped.trackingId };
  }
}

@Host({ name: "order-workflow" })
export class OrderWorkflow extends workflowHost(
  z.object({ orderId: z.string() }),
) {
  @WorkflowTask<typeof OrderWorkflow>({ parents: [] })
  public async validate(ctx: WorkflowCtx<typeof this>) {
    return { valid: true };
  }

  @DurableWorkflowTask<typeof OrderWorkflow>({ parents: ["validate"] })
  public async approve(ctx: DurableWorkflowCtx<typeof this>) {
    return await ctx.waitForEvent("order:approved");
  }
}
```

### Durable Context

In addition to the regular context members, a durable context provides:

| Member                           | Description                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ctx.run(ref, input, opts?)`     | Runs a child task or workflow, recorded in the durable event log                                                      |
| `ctx.sleepFor(duration)`         | Sleeps for a duration                                                                                                 |
| `ctx.sleepUntil(date)`           | Sleeps until a date                                                                                                   |
| `ctx.waitFor(conditions)`        | Waits for SDK conditions                                                                                              |
| `ctx.waitForEvent(event, opts?)` | Waits for an event. An `EventDefinition` returns the validated payload, a string key returns the raw payload          |
| `ctx.now()`                      | Returns the current time, recorded in the durable event log                                                           |
| `ctx.invocationCount`            | Number of times this durable task has been invoked, starting at 1                                                     |
| `ctx.isReplay`                   | `true` whenever this durable task was re-invoked (`invocationCount > 1`), after eviction, a worker restart or a retry |
| `ctx.fromSDK`                    | The SDK `DurableContext`                                                                                              |

`waitForEvent` options are `expression`, `scope`, `lookbackWindow` and `label`. With an `EventDefinition`,
a payload that fails the schema throws `EventPayloadMalformedException`. This includes the empty payload
the SDK resolves with when no event matched; pass the string key instead if that case is expected.
The payload of events sent with `Client.emit` includes the `__event_name` marker, so `.strict()` schemas
reject it, the same as with `isEvent` and `cast`.

`isDurableCtx(ctx)` tells a durable context apart from a regular one, for example in a task interceptor.

### Child Runs

Durable `ctx.run` spawns children through `DurableContext.spawnChild`/`spawnChildren`, so their results are
recorded and returned on replay instead of spawning the children again. It has these limits:

- It always waits for the result. `wait: false` throws `DurableRunNoWaitException`.
- It requires a Hatchet engine with durable eviction support (>= v0.80.0). On older engines, or when the
  engine version is unknown, it throws `DurableEvictionNotSupportedException`. This is stricter than the SDK,
  which falls back to unrecorded child runs. `ctx.fromSDK.spawnChild` remains available as an escape hatch.

Side effects belong in separate task hosts that the durable task calls through `ctx.run(taskRef(...))`.
Each child run executes once and its output is replayed from the event log, and each side effect gets its
own retries and timeouts.

### Determinism

1. A durable task re-runs from the top on each invocation. Only durable calls (`run`, `sleepFor`,
   `sleepUntil`, `waitFor`, `waitForEvent`, `now`) return recorded results.
2. Durable calls are matched by order. Changing their sequence while runs are in flight can fail those runs
   (SDK `NonDeterminismError`).
3. Branch only on the input and on durable results. Use `ctx.now()`, not `Date.now()`.
4. Task interceptors and input schemas run on every invocation, including re-invocations. Skip one-shot side
   effects in interceptors when `isDurableCtx(ctx) && ctx.isReplay` is true.

### Engines Without Eviction Support

| Member                                | Behavior                                                  |
| ------------------------------------- | --------------------------------------------------------- |
| `run`                                 | Throws `DurableEvictionNotSupportedException`             |
| `sleepFor`, `waitFor`, `waitForEvent` | Forwarded to the SDK unchanged                            |
| `now`, `sleepUntil`                   | Forwarded to the SDK unchanged, not stable across replays |
| `waitForEvent` with `lookbackWindow`  | Forwarded to the SDK unchanged, not stable across replays |
| `invocationCount`, `isReplay`         | Forwarded                                                 |

## API Reference

### Module

| Method                                | Description                                 |
| ------------------------------------- | ------------------------------------------- |
| `HatchetModule.forRoot(config)`       | Initialize with synchronous config          |
| `HatchetModule.forRootAsync(options)` | Initialize with async config factory        |
| `HatchetModule.forFeature(...refs)`   | Register tasks/workflows in feature modules |

Module options (extras to `forRoot`/`forRootAsync`):

| Option               | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `taskInterceptors`   | `TaskInterceptor` classes wrapping each task execution |
| `interceptors`       | Deprecated, use `taskInterceptors`                     |
| `clientInterceptors` | `ClientInterceptor` classes wrapping `emit` and `run`  |

### Decorators

| Decorator                    | Description                            |
| ---------------------------- | -------------------------------------- |
| `@Host(opts)`                | Mark class as task or workflow host    |
| `@Task(opts)`                | Mark method as standalone task         |
| `@WorkflowTask(opts)`        | Mark method as workflow step           |
| `@DurableTask(opts)`         | Mark method as durable standalone task |
| `@DurableWorkflowTask(opts)` | Mark method as durable workflow step   |

### Host Factories

| Factory                 | Description                    |
| ----------------------- | ------------------------------ |
| `taskHost(schema?)`     | Create TaskHost base class     |
| `workflowHost(schema?)` | Create WorkflowHost base class |

### References

| Function                     | Description                         |
| ---------------------------- | ----------------------------------- |
| `taskRef(TaskClass)`         | Create type-safe task reference     |
| `workflowRef(WorkflowClass)` | Create type-safe workflow reference |

### Client

| Method                                    | Description                                    |
| ----------------------------------------- | ---------------------------------------------- |
| `client.run(ref, input, opts?)`           | Execute task/workflow                          |
| `client.emit(event, payload \| payloads)` | Emit one or many events                        |
| `client.emitBulk(event, payloads)`        | Emit multiple events (deprecated — use `emit`) |

Calls to `emit`, `emitBulk` and `run` pass through registered [client interceptors](#client-interceptors).

### Context Types

| Type                    | Description                        |
| ----------------------- | ---------------------------------- |
| `TaskCtx<T>`            | Context for task execution         |
| `WorkflowCtx<T>`        | Context for workflow tasks         |
| `HelperCtx<T>`          | Context for helper methods         |
| `DurableTaskCtx<T>`     | Context for durable task execution |
| `DurableWorkflowCtx<T>` | Context for durable workflow tasks |

### Context Properties

```typescript
ctx.input       // Validated input data
ctx.fromSDK     // Underlying Hatchet SDK context
ctx.run(ref, input, opts ?)  // Invoke other tasks/workflows
ctx.parent(method)          // Get parent task output (WorkflowCtx only)
ctx.sleepFor(duration)      // Durable sleep (durable contexts only)
ctx.waitForEvent(event, opts ?)  // Durable event wait (durable contexts only)
```

## License

Apache-2.0
