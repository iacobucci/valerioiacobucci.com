import { Ast } from "../../parser/ast";
import { COMPILER_ENV } from "../environment";
import { Evaluable } from "../evaluable";

export class ENumber extends Evaluable {
	static evaluate(node: Ast): number {
		let value = Number.parseInt(node.literal || "");
		return value;
	}

	static compile(node: Ast): string[] {
		let indentation = this.indentation(node);
		let asm: string[] = [];

		let destination_register = COMPILER_ENV.get();

		asm.push(`${indentation}addi a${destination_register}, zero, ${Number.parseInt(node.literal || "")}`);

		if (destination_register == 1)
			asm.push(`${indentation}addi a0, zero, ${Number.parseInt(node.literal || "")}`);

		return asm;
	}
}
