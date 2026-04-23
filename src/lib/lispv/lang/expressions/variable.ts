import { Ast } from "../../parser/ast";
import { COMPILER_ENV, INTERPRETER_ENV } from "../environment";
import { Evaluable } from "../evaluable";

export class EVariable extends Evaluable {
	static evaluate(node: Ast): number {
		let name: string;
		if (!node.literal)
			throw new Error("variable name cannot be empty");

		name = node.literal;

		let value = INTERPRETER_ENV.variables.find(name);

		if (value === undefined)
			throw new Error(`variable ${name} undefined at level ${INTERPRETER_ENV.variables.current}`);

		return value;
	}

	static compile(node: Ast): string[] {
		let asm: string[] = []
		let indentation = this.indentation(node);

		let name: string;

		if (!node.literal)
			throw new Error("variable name cannot be empty");

		name = node.literal;

		let index = COMPILER_ENV.variables.find(name);

		if (index === undefined)
			throw new Error(`variable ${name} undefined at level ${INTERPRETER_ENV.variables.current}`);


		let source_register = `a${index}`;

		if (COMPILER_ENV.inDefinition)
			source_register = `t${index}`;

		asm.push(`${indentation}add a${COMPILER_ENV.get()}, zero, ${source_register}`);
		asm.push(`${indentation}add a0, zero, ${source_register}`);

		return asm;
	}
}
