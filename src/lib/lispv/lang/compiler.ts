import { COMPILER_ENV } from "./environment";
import { EExpression } from "./expressions/expression";
import { Traversal } from "./traversal";

export class Compiler {
	static indentation: boolean = false;
	lines: string[];

	constructor(lines: string[] | string, cleanEnv = true) {
		if (cleanEnv)
			COMPILER_ENV.clean()
		this.lines = Traversal.cleanLines(lines);
	}

	static toggleIndentation() {
		Compiler.indentation = true;
	}

	compile(): string[] {

		let asm: string[] = [];

		for (let i = 0; i < this.lines.length; i++) {

			let line = this.lines[i];

			let ast = Traversal.cleanAst(line)

			if (!ast)
				continue;

			const result = Traversal.explore(ast, EExpression.compile);

			if (result === undefined)
				throw new Error("impossible");

			asm = asm.concat(result);
		}

		return asm;
	}
}

