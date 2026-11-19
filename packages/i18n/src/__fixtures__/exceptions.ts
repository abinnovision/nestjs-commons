import { AppException } from "@abinnovision/nestjs-exceptions";

export class EmailTakenException extends AppException<{ email: string }> {
	public readonly code = "USER__EMAIL_TAKEN";

	public constructor(email: string) {
		super(`Email '${email}' is already taken`, { meta: { email } });
	}
}

export function notAnException(): void {}

export abstract class WideCodeException extends AppException {
	public abstract override readonly code: string;
}

export class ProtectedCtorException extends AppException {
	public readonly code = "USER__PROTECTED";

	protected constructor() {
		super("Protected");
	}
}
