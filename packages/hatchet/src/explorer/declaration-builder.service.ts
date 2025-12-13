import {
	Context,
	TaskWorkflowDeclaration,
	WorkflowDeclaration,
} from "@hatchet-dev/typescript-sdk";
import { CreateWorkflowTaskOpts } from "@hatchet-dev/typescript-sdk/v1/task";
import { Injectable } from "@nestjs/common";
import { MetadataScanner, Reflector } from "@nestjs/core";
import { DirectedGraph } from "directed-graph-typed";

import { TaskHost, WorkflowHost } from "../abstracts";
import { createTaskCtx, createWorkflowCtx } from "../context";
import { WorkflowTaskOpts } from "../decorators";
import { METADATA_KEY_WORKFLOW_TASK_OPTS } from "../internal";
import { getHostAnnotatedMethods, getHostMetadata } from "./utils";
import { AnyHost } from "../ref";

@Injectable()
export class DeclarationBuilderService {
	public constructor(
		private readonly scanner: MetadataScanner,
		private readonly reflector: Reflector,
	) {}

	public async createDeclaration(
		host: AnyHost,
	): Promise<WorkflowDeclaration | TaskWorkflowDeclaration> {
		if (host instanceof WorkflowHost) {
			return await this.createWorkflow(host);
		} else {
			return await this.createTaskWorkflow(host);
		}
	}

	private async createTaskWorkflow(
		host: TaskHost<any>,
	): Promise<TaskWorkflowDeclaration> {
		// First, validate the host.
		await this.validateTaskHost(host);

		// Get the host opts from the metadata.
		const hostOpts = getHostMetadata(host, this.reflector);

		// Get the single decorated method name.
		const decoratedMethods = getHostAnnotatedMethods(host, this.scanner);
		const methodName = decoratedMethods[0]!;
		const proto = Object.getPrototypeOf(host);

		// Construct an unbound declaration for it.
		return new TaskWorkflowDeclaration({
			...hostOpts,
			fn: async (_: unknown, ctx: Context<any>) => {
				const validatedInput = await this.validateAndTransformInput(
					host,
					ctx.input,
				);

				const taskCtx = createTaskCtx(ctx, validatedInput);

				return await proto[methodName].call(host, taskCtx);
			},
		});
	}

	private async createWorkflow(
		host: WorkflowHost<any>,
	): Promise<WorkflowDeclaration> {
		// First, validate the host.
		await this.validateWorkflowHost(host);

		const graph = await this.buildWorkflowHostGraph(host);

		const hostOpts = getHostMetadata(host, this.reflector);

		// Construct an unbound declaration for it.
		const workflowDec = new WorkflowDeclaration({
			...hostOpts,
		});

		const proto = Object.getPrototypeOf(host);

		// Mapping of task name to task declaration.
		const taskDecls = new Map<string, CreateWorkflowTaskOpts>();

		// Topologically sort the graph.
		// This helps us to initialize the tasks in the correct order and ensure the parents are present.
		const topoSorted = graph.topologicalSort("key") as string[];

		for (let method of topoSorted!) {
			const ref = proto[method];
			const metadata = this.reflector.get(
				METADATA_KEY_WORKFLOW_TASK_OPTS,
				ref,
			) as WorkflowTaskOpts<any>;

			const parentNames = metadata.parents ?? [];

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
				fn: async (_: unknown, ctx: Context<any>) => {
					const validatedInput = await this.validateAndTransformInput(
						host,
						ctx.input,
					);

					const workflowCtx = createWorkflowCtx(ctx, validatedInput);

					return await proto[method].call(host, workflowCtx);
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
	private async validateWorkflowHost(input: WorkflowHost<any>) {
		const proto = Object.getPrototypeOf(input);
		const allMethodNames = this.scanner.getAllMethodNames(proto);

		// Find all the methods that are decorated with @WorkflowTask().
		const decoratedMethods = allMethodNames.filter((method) => {
			const ref = proto[method];
			const metadata = this.reflector.get(METADATA_KEY_WORKFLOW_TASK_OPTS, ref);
			return metadata !== undefined;
		});

		// Validate that there is at least one decorated method.
		if (decoratedMethods.length === 0) {
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
	private async validateTaskHost(input: TaskHost<any>) {
		const proto = Object.getPrototypeOf(input);
		const decoratedMethods = getHostAnnotatedMethods(input, this.scanner);

		// Validate that there is exactly one decorated method.
		if (decoratedMethods.length !== 1) {
			throw new Error(
				`TaskHost '${input.constructor.name}' must have exactly one decorated method with @Task()`,
			);
		}

		const targetMethod = decoratedMethods[0]!;

		// Special metadata key to load the design:paramtypes.
		const params = Reflect.getMetadata(
			"design:paramtypes",
			proto,
			targetMethod,
		);

		// Validate that there is exactly one parameter.
		if (params.length !== 1) {
			throw new Error(
				`TaskHost '${input.constructor.name}' method '${targetMethod}' must have exactly one parameter of type 'CtxTask<typeof this>'`,
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
	private async buildWorkflowHostGraph(
		host: WorkflowHost<any>,
	): Promise<DirectedGraph<string>> {
		const proto = Object.getPrototypeOf(host);

		// Get all the methods that are decorated with @WorkflowTask().
		const decoratedMethods = getHostAnnotatedMethods(host, this.scanner);

		const graph = new DirectedGraph();

		// First, add all the vertices.
		for (let method of decoratedMethods) {
			graph.addVertex(method);
		}

		// Then add all the edges between the vertices.
		for (let method of decoratedMethods) {
			const ref = proto[method];
			const metadata = this.reflector.get(
				METADATA_KEY_WORKFLOW_TASK_OPTS,
				ref,
			) as WorkflowTaskOpts<any>;

			for (let parent of metadata.parents ?? []) {
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
	 * Validates and transforms input using the host's schema.
	 * Returns the transformed input if schema exists, otherwise returns original input.
	 */
	private async validateAndTransformInput<I>(
		host: AnyHost,
		input: I,
	): Promise<I> {
		const schema = host.inputSchema();

		if (!schema) {
			return input;
		}

		const result = await schema["~standard"].validate(input);

		if ("issues" in result && result.issues) {
			throw new Error(
				`Input validation failed: ${JSON.stringify(result.issues)}`,
			);
		}

		return (result as { value: I }).value;
	}
}
