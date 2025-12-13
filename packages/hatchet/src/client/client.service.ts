import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { Injectable } from "@nestjs/common";

import { createHostRunForAdmin, HostRunFn } from "../interaction";

@Injectable()
export class Client {
	public readonly run: HostRunFn;

	public constructor(client: HatchetClient) {
		this.run = createHostRunForAdmin(client);
	}
}
