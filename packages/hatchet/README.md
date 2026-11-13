# @abinnovision/nestjs-hatchet

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-hatchet?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-hatchet)

NestJS integration for [Hatchet](https://hatchet.run), a distributed workflow orchestration engine. Tasks,
workflows and events are declared as decorated Nest providers with schema-validated inputs, and the module
registers them with a Hatchet worker.

## Installation

```bash
yarn add @abinnovision/nestjs-hatchet @hatchet-dev/typescript-sdk
```

`@hatchet-dev/typescript-sdk` is a peer dependency, so your application picks the SDK version.
Import SDK types such as `Context` directly from it.

## Quick start

### 1. Configure the module

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

Nest's shutdown hooks stop the worker after running tasks finish. Call
`app.enableShutdownHooks()` so this also happens on `SIGTERM`/`SIGINT`, or set
`handleKill: true` in the worker options to let the Hatchet SDK handle the signals.

### 2. Define a task

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

### 3. Register and invoke

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

`forFeature()` only registers the hosts with the worker. Each host must also be in the
`providers` of a module, or the application fails to start because the worker cannot
resolve it.

## Core concepts

### Tasks

A task is a standalone unit of work with a single method.

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

A workflow has several tasks that can depend on each other through `parents`.

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

An event definition pairs an event key with a schema for its payload.

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

## Advanced usage

### Non-blocking execution

```typescript
const runRef = await ctx.run(taskRef(SomeTask), input, { wait: false });
// Continue without waiting...
const result = await runRef.output; // Await when needed
```

### Bulk event emission

```typescript
await client.emit(OrderEvent, [
  { orderId: "1", total: 100 },
  { orderId: "2", total: 200 },
]);
```

### Helper methods

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

## Interceptors

There are two kinds of interceptors:

- A `TaskInterceptor` wraps every task execution on the worker, including each task of a workflow.
- A `ClientInterceptor` wraps `client.emit` and `client.run` on the producer side.

Register them with the `taskInterceptors` and `clientInterceptors` options of `forRoot()`/`forRootAsync()`,
and list each class in `providers`. The module resolves interceptors from the application, so a missing
provider fails application startup.

### Example: correlation ids

This example carries a correlation id from an HTTP request to the task that the request starts:

1. A middleware stores the id of each request in an `AsyncLocalStorage`.
2. The client interceptor copies the id into the `additionalMetadata` of every run and event.
3. On the worker, the task interceptor reads the id back from the metadata and restores the storage
   before the task runs.

```typescript
// correlation.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import {
  BaseCtx,
  ClientInterceptor,
  EmitCtx,
  EmitOptions,
  RunCtx,
  RunOptions,
  TaskInterceptor,
} from "@abinnovision/nestjs-hatchet";
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

const storage = new AsyncLocalStorage<{ id: string }>();

export const correlationId = () => storage.getStore()?.id;

// Opens a correlation context for every HTTP request.
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  public use(req: Request, _res: Response, next: NextFunction) {
    const id = req.header("x-correlation-id") ?? randomUUID();
    storage.run({ id }, next);
  }
}

// Producer side: adds the id to the metadata of every emit and run.
@Injectable()
export class CorrelationClientInterceptor extends ClientInterceptor {
  public override interceptEmit(
    ctx: EmitCtx,
    next: (options?: EmitOptions) => Promise<unknown>,
  ) {
    const id = correlationId();
    if (!id) return next();

    return next({
      ...ctx.options,
      additionalMetadata: {
        correlationId: id,
        ...ctx.options?.additionalMetadata,
      },
    });
  }

  public override interceptRun(
    ctx: RunCtx,
    next: (options?: RunOptions) => Promise<unknown>,
  ) {
    const id = correlationId();
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

// Worker side: restores the id from the metadata of the running task.
@Injectable()
export class CorrelationTaskInterceptor extends TaskInterceptor {
  public intercept<T>(ctx: BaseCtx<any>, next: () => Promise<T>) {
    const { correlationId: id = randomUUID() } =
      ctx.fromSDK.additionalMetadata();

    return storage.run({ id }, next);
  }
}
```

```typescript
// app.module.ts
import {
  Client,
  HatchetModule,
  Host,
  Task,
  TaskCtx,
  taskHost,
  taskRef,
} from "@abinnovision/nestjs-hatchet";
import {
  Controller,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  Post,
} from "@nestjs/common";
import { z } from "zod";

import {
  CorrelationClientInterceptor,
  CorrelationMiddleware,
  CorrelationTaskInterceptor,
  correlationId,
} from "./correlation";

@Host({ name: "send-welcome-mail" })
export class SendWelcomeMailTask extends taskHost(
  z.object({ userId: z.string() }),
) {
  private readonly logger = new Logger(SendWelcomeMailTask.name);

  @Task({})
  public async task(ctx: TaskCtx<typeof this>) {
    // Same id as the HTTP request that started the run.
    this.logger.log(`Sending mail to ${ctx.input.userId} [${correlationId()}]`);
    return { sent: true };
  }
}

@Controller("users")
export class UsersController {
  public constructor(private readonly client: Client) {}

  @Post()
  public async create() {
    return this.client.run(taskRef(SendWelcomeMailTask), { userId: "123" });
  }
}

@Module({
  imports: [
    HatchetModule.forRoot({
      config: {},
      worker: { name: "my-worker" },
      clientInterceptors: [CorrelationClientInterceptor],
      taskInterceptors: [CorrelationTaskInterceptor],
    }),
    HatchetModule.forFeature(taskRef(SendWelcomeMailTask)),
  ],
  controllers: [UsersController],
  providers: [
    SendWelcomeMailTask,
    CorrelationClientInterceptor,
    CorrelationTaskInterceptor,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}
```

`POST /users` with the header `x-correlation-id: abc` logs `Sending mail to 123 [abc]` on the worker.
Because the task interceptor restores the storage, a `client.run` or `client.emit` inside the task
forwards the same id. Child runs started with `ctx.run` inherit the parent's metadata on Hatchet engine
`>= v0.104.0`.

### Behavior

- Interceptors run in array order, the first one outermost. An interceptor may skip `next()` to
  short-circuit the call.
- A client interceptor can change the options but not the payload or input. `next(options)` replaces the
  options for the rest of the chain, so spread `ctx.options` to keep the caller's values. `wait` cannot be
  changed.
- A bulk emit or a run with array input passes through each client interceptor once.
- With `wait: true` (the default), `interceptRun` spans the whole run. With `wait: false`, it spans only
  the enqueue.
- Calling `client.emit` or `client.run` inside a client interceptor goes through the chain again, so guard
  against recursion.
- Task interceptors on durable tasks run again on every replay. See [Determinism](#determinism).

## Durable tasks

Durable tasks use Hatchet's durable execution. Waits, sleeps and child runs are recorded in a durable event
log, so a durable task can be evicted from the worker and resumed later without repeating recorded work.

Pass `durable: true` to `@Task()` or `@WorkflowTask()`. The method must then take a `DurableTaskCtx` or
`DurableWorkflowCtx`. A mismatch in either direction is rejected at compile time, as are options that only
apply to the other kind (`evictionPolicy` without `durable: true`, `slotCost` or `batch` with it). Durable and
non-durable tasks can be mixed in one workflow and can be each other's `parents`.

```typescript
@Host({ name: "order-fulfillment" })
export class OrderFulfillmentTask extends taskHost(
  z.object({ orderId: z.string() }),
) {
  @Task({ durable: true, executionTimeout: "1h" })
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

  @WorkflowTask<typeof OrderWorkflow>({ durable: true, parents: ["validate"] })
  public async approve(ctx: DurableWorkflowCtx<typeof this>) {
    return await ctx.waitForEvent("order:approved");
  }
}
```

### Durable context

A durable context has these members on top of the regular ones:

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

### Child runs

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

### Engines without eviction support

| Member                                | Behavior                                                  |
| ------------------------------------- | --------------------------------------------------------- |
| `run`                                 | Throws `DurableEvictionNotSupportedException`             |
| `sleepFor`, `waitFor`, `waitForEvent` | Forwarded to the SDK unchanged                            |
| `now`, `sleepUntil`                   | Forwarded to the SDK unchanged, not stable across replays |
| `waitForEvent` with `lookbackWindow`  | Forwarded to the SDK unchanged, not stable across replays |
| `invocationCount`, `isReplay`         | Forwarded                                                 |

## API reference

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

| Decorator             | Description                         |
| --------------------- | ----------------------------------- |
| `@Host(opts)`         | Mark class as task or workflow host |
| `@Task(opts)`         | Mark method as standalone task      |
| `@WorkflowTask(opts)` | Mark method as workflow step        |

### Host factories

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

| Method                                    | Description                                   |
| ----------------------------------------- | --------------------------------------------- |
| `client.run(ref, input, opts?)`           | Execute task/workflow                         |
| `client.emit(event, payload \| payloads)` | Emit one or many events                       |
| `client.emitBulk(event, payloads)`        | Emit multiple events (deprecated, use `emit`) |

Calls to `emit`, `emitBulk` and `run` pass through registered [client interceptors](#interceptors).

### Context types

| Type                    | Description                        |
| ----------------------- | ---------------------------------- |
| `TaskCtx<T>`            | Context for task execution         |
| `WorkflowCtx<T>`        | Context for workflow tasks         |
| `HelperCtx<T>`          | Context for helper methods         |
| `DurableTaskCtx<T>`     | Context for durable task execution |
| `DurableWorkflowCtx<T>` | Context for durable workflow tasks |

### Context properties

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
