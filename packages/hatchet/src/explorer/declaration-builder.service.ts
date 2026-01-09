import {
	Context,
	TaskWorkflowDeclaration,
	WorkflowDeclaration,
} from "@hatchet-dev/typescript-sdk";
import { CreateWorkflowTaskOpts } from "@hatchet-dev/typescript-sdk/v1/task";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { DirectedGraph } from "directed-graph-typed";

import { TaskHost, WorkflowHost } from "../abstracts";
import { fromInstance } from "../accessor";
import { createTaskCtx, createWorkflowCtx } from "../context/context-factory";
import { EVENT_MARKER } from "../events";
import { Interceptor } from "../interceptor";
import { InterceptorRegistration } from "../internal";
import { AnyHost } from "../ref";

import type { BaseCtx, TriggerSource } from "../context";

@Injectable()
export class DeclarationBuilderService {
	private readonly interceptors: Interceptor[];

	public constructor(
		private readonly moduleRef: ModuleRef,
		@Optional()
		@Inject(InterceptorRegistration)
		private readonly interceptorRegistration?: InterceptorRegistration,
	) {
		// Try to resolve the refs to the instances.
		const resolvedRefs = this.interceptorRegistration?.refs.map((token) =>
			this.moduleRef.get(token, { strict: false }),
		);

		this.interceptors = resolvedRefs ?? [];
	}

	/**
	 * Creates a WorkflowDeclaration or TaskWorkflowDeclaration from the given host.
	 *
	 * @param host The host to create a declaration for.
	 * @returns A WorkflowDeclaration or TaskWorkflowDeclaration.
	 */
	public createDeclaration(
		host: AnyHost,
	): WorkflowDeclaration | TaskWorkflowDeclaration {
		if (host instanceof WorkflowHost) {
			return this.createWorkflow(host);
		} else {
			return this.createTaskWorkflow(host);
		}
	}

	private createTaskWorkflow(host: TaskHost<any>): TaskWorkflowDeclaration {
		// First, validate the host.
		this.validateTaskHost(host);

		const accessor = fromInstance(host);

		// Get the host options from the metadata.
		const hostOpts = accessor.metadata;

		// Get the single decorated method name.
		const methodName = accessor.methods[0];
		if (!methodName) {
			throw new Error("Could not find method name for TaskHost");
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const proto = Object.getPrototypeOf(host);

		// Construct an unbound declaration for it.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return new TaskWorkflowDeclaration({
			...hostOpts,
			fn: async (_: unknown, ctx: Context<any>): Promise<any> => {
				const partial = await this.inferInputRelated(host, ctx);

				// Create the task context from the SDK context and the partial.
				const taskCtx = createTaskCtx(
					ctx,
					partial.triggerSource,
					partial.input,
				);

				return await this.executeWithInterceptors(taskCtx, async () => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
					const fn = proto[methodName];

					// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
					return await fn.call(host, taskCtx);
				});
			},
		});
	}

	private createWorkflow(host: WorkflowHost<any>): WorkflowDeclaration {
		// First, validate the host.
		this.validateWorkflowHost(host);

		const accessor = fromInstance(host);
		const graph = this.buildWorkflowHostGraph(host);

		const hostOpts = accessor.metadata;

		// Construct an unbound declaration for it.
		const workflowDec = new WorkflowDeclaration({
			...hostOpts,
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const proto = Object.getPrototypeOf(host);

		// Mapping of task name to task declaration.
		const taskDecls = new Map<string, CreateWorkflowTaskOpts>();

		// Topologically sort the graph.
		// This helps us to initialize the tasks in the correct order and ensure the parents are present.
		const topoSorted = graph.topologicalSort("key") as string[];

		for (const method of topoSorted) {
			const metadata = accessor.getWorkflowTaskMeta(method);

			const parentNames: string[] = metadata.parents ?? [];

			const parentsResolved = parentNames.map((parent) => {
				const parentDecl = taskDecls.get(parent);
				if (!parentDecl) {
					throw new Error(
						`WorkflowHost '${host.constructor.name}' has a task '${method}' that depends on '${parent}', but '${parent}' is not a valid task`,
					);
				}

				return parentDecl;
			});

			const newTaskDecl = workflowDec.task({
				...metadata,
				name: method,
				parents: parentsResolved,
				fn: async (_: unknown, ctx: Context<any>): Promise<any> => {
					const partial = await this.inferInputRelated(host, ctx);

					// Create the workflow context from the SDK context and the partial
					const workflowCtx = createWorkflowCtx(
						ctx,
						partial.triggerSource,
						partial.input,
					);

					return await this.executeWithInterceptors(workflowCtx, async () => {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
						const fn = proto[method];

						// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
						return await fn.call(host, workflowCtx);
					});
				},
			});

			taskDecls.set(method, newTaskDecl);
		}

		return workflowDec;
	}

	/**
	 *  Validates the given WorkflowHost with basic sanity checks.
	 *  This does not return, rather it throws an error if the host is invalid.
	 *
	 * @param input The host to validate.
	 * @private
	 */
	private validateWorkflowHost(input: WorkflowHost<any>) {
		const accessor = fromInstance(input);

		// Validate that there is at least one decorated method.
		if (accessor.methods.length === 0) {
			throw new Error(
				`WorkflowHost '${input.constructor.name}' must have at least one decorated method with @WorkflowTask()`,
			);
		}
	}

	/**
	 *  Validates the given TaskHost with basic sanity checks.
	 *  This does not return, rather it throws an error if the host is invalid.
	 *
	 * @param input The host to validate.
	 * @private
	 */
	private validateTaskHost(input: TaskHost<any>) {
		const accessor = fromInstance(input);

		// Validate that there is exactly one decorated method.
		if (accessor.methods.length !== 1) {
			throw new Error(
				`TaskHost '${input.constructor.name}' must have exactly one decorated method with @Task()`,
			);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const proto = Object.getPrototypeOf(input);

		const targetMethod = accessor.methods[0];
		if (!targetMethod) {
			throw new Error("Could not find method name for TaskHost");
		}

		// Special metadata key to load the design:paramtypes.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const params: any[] = Reflect.getMetadata(
			"design:paramtypes",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			proto,
			targetMethod,
		);

		// Validate that there is exactly one parameter.
		if (params.length !== 1) {
			throw new Error(
				`TaskHost '${input.constructor.name}' method '${targetMethod}' must have exactly one parameter of type 'TaskCtx<typeof this>'`,
			);
		}
	}

	/**
	 * Builds a directed graph of the workflow host.
	 * The nodes are the methods of the host, and the edges are the dependencies between the methods.
	 *
	 * Note: This validates for cyclic dependencies and throws an
	 *
	 * @param host The host to build the graph for.
	 * @returns The directed graph.
	 * @private
	 */
	private buildWorkflowHostGraph(
		host: WorkflowHost<any>,
	): DirectedGraph<string> {
		const accessor = fromInstance(host);

		// Get all the methods that are decorated with @WorkflowTask().
		const decoratedMethods = accessor.methods;

		const graph = new DirectedGraph<string>();

		// First, add all the vertices.
		for (const method of decoratedMethods) {
			graph.addVertex(method);
		}

		// Then add all the edges between the vertices.
		for (const method of decoratedMethods) {
			const metadata = accessor.getWorkflowTaskMeta(method);

			for (const parent of metadata.parents ?? []) {
				graph.addEdge(parent, method);
			}
		}

		// Validate that there are no circular dependencies.
		// Per docs of topologicalSort(), it returns undefined if there is a cycle.
		if (graph.topologicalSort() === undefined) {
			throw new Error(
				`WorkflowHost '${host.constructor.name}' has a circular dependency between its tasks`,
			);
		}

		return graph;
	}

	/**
	 * Infers the input related information from the context.
	 *
	 * @returns The transformed input if schema exists, otherwise returns original input.
	 */
	private async inferInputRelated(
		host: AnyHost,
		context: Context<any>,
	): Promise<Pick<BaseCtx<unknown>, "input" | "triggerSource">> {
		// Infer the trigger source.
		const triggerSource = this.inferTriggerSource(context);

		// Extract the input from the context.
		// We default to an empty object if input is undefined.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const input = context.input ?? {};

		// Only run validation for "run" triggers.
		// All other triggers skip validation here.
		if (triggerSource === "run") {
			// Resolve the schema from the host.
			const schema = host.inputSchema();

			// If there is no schema, return the input as is (after normalizing).
			if (!schema) {
				return { input, triggerSource };
			}

			// Validate the input against the schema.
			const result = await schema["~standard"].validate(input);

			// If the result is successful, return the transformed value.
			if ("value" in result) {
				return {
					input: result.value,
					triggerSource,
				};
			}

			throw new Error(
				`Input validation failed: ${JSON.stringify(result.issues)}`,
			);
		} else {
			// For non-"run" triggers, skip validation and return the input as is.
			return { input, triggerSource };
		}
	}
	/**
	 * Executes a function, optionally intercepted by the interceptors.
	 * Interceptors are chained in array order (first = outermost).
	 *
	 * @param ctx The context.
	 * @param fn The function to execute.
	 * @returns The result of the function.
	 */
	private async executeWithInterceptors<T>(
		ctx: BaseCtx<any>,
		fn: () => Promise<T>,
	): Promise<T> {
		if (!this.interceptors.length) {
			return await fn();
		}

		// Chain from last to first (first interceptor is outermost)
		let next = fn;
		for (let i = this.interceptors.length - 1; i >= 0; i--) {
			const interceptor = this.interceptors[i]!;
			const currentNext = next;
			next = () => interceptor.intercept(ctx, currentNext);
		}

		return await next();
	}

	/**
	 * Infers the trigger source from the given context.
	 *
	 * @param ctx The context.
	 * @returns The inferred trigger source.
	 * @private
	 */
	private inferTriggerSource(ctx: Context<any>): TriggerSource {
		// If the input contains the EVENT_MARKER, it's an event trigger.
		// This is specific to event triggers from this library.
		if (typeof ctx.input === "object" && EVENT_MARKER in ctx.input) {
			return "event";
		}

		// Additional metadata can also indicate cron or event triggers.
		const metadata = ctx.additionalMetadata();

		// Check for cron metadata key.
		if ("hatchet__cron_name" in metadata) {
			return "cron";
		}

		// Check for event metadata key.
		if ("hatchet__event_key" in metadata) {
			return "event";
		}

		// Default to "run" for direct runs.
		// We cannot reliably detect other sources at this time.
		// The "other" source is reserved for future use.
		return "run";
	}
}
