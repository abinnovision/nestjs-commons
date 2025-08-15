import { TOKEN_HATCHET_WORKER_OPTS_PREFIX } from "./shared-consts";

export const getWorkerOptsToken = (name: string) => {
	return `${TOKEN_HATCHET_WORKER_OPTS_PREFIX}${name}`;
};
