# @abinnovision/nestjs-hatchet

[![npm](https://img.shields.io/npm/v/@abinnovision/nestjs-hatchet?style=flat-square)](https://www.npmjs.com/package/@abinnovision/nestjs-hatchet)

NestJS integration for [Hatchet](https://hatchet.run) - a distributed workflow orchestration engine. Provides type-safe decorators, services, and event handling for building robust workflows.

## Installation

```bash
yarn add @abinnovision/nestjs-hatchet
```

### Hatchet SDK Re-export

This package re-exports `@hatchet-dev/typescript-sdk`, so you can import SDK types and
classes directly without adding the Hatchet SDK as a separate dependency:

```typescript
import { HatchetClient, Context } from "@abinnovision/nestjs-hatchet/sdk";
```

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

## API Reference

### Module

| Method                                | Description                                 |
| ------------------------------------- | ------------------------------------------- |
| `HatchetModule.forRoot(config)`       | Initialize with synchronous config          |
| `HatchetModule.forRootAsync(options)` | Initialize with async config factory        |
| `HatchetModule.forFeature(...refs)`   | Register tasks/workflows in feature modules |

### Decorators

| Decorator             | Description                         |
| --------------------- | ----------------------------------- |
| `@Host(opts)`         | Mark class as task or workflow host |
| `@Task(opts)`         | Mark method as standalone task      |
| `@WorkflowTask(opts)` | Mark method as workflow step        |

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

### Context Types

| Type             | Description                |
| ---------------- | -------------------------- |
| `TaskCtx<T>`     | Context for task execution |
| `WorkflowCtx<T>` | Context for workflow tasks |
| `HelperCtx<T>`   | Context for helper methods |

### Context Properties

```typescript
ctx.input       // Validated input data
ctx.fromSDK     // Underlying Hatchet SDK context
ctx.run(ref, input, opts ?)  // Invoke other tasks/workflows
ctx.parent(method)          // Get parent task output (WorkflowCtx only)
```

## License

Apache-2.0
