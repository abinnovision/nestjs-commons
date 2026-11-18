import { AppException } from "@abinnovision/nestjs-exceptions";

export class EmailTakenException extends AppException<{ email: string }> {
	public readonly code = "USER__EMAIL_TAKEN";

	public constructor(email: string) {
		super(`Email '${email}' is already taken`, { meta: { email } });
	}
}
