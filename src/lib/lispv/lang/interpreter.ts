import { Traversal } from "./traversal";
import { DEBUG, DEBUG_INTERPRETER } from "../flags";
import { INTERPRETER_ENV } from "./environment";
import { EExpression } from "./expressions/expression";

export class Interpreter {
	lines: string[];
	debug = DEBUG || DEBUG_INTERPRETER;

	constructor(lines: string[] | string, cleanEnv = true) {
		if (cleanEnv)
			INTERPRETER_ENV.clean()
		this.lines = Traversal.cleanLines(lines);
	}

	run() {
		let map = this.runAndGetLineNumberToAnswerMap();
		let entries = Array.from(map.entries());
		let entry = entries.at(entries.length - 1)?.at(1);
		return entry || 0;
	}

	runAndGetLineNumberToAnswerMap(): Map<number, number> {

		let m = new Map<number, number>();

		for (let i = 0; i < this.lines.length; i++) {

			let ast = Traversal.cleanAst(this.lines[i]);

			if (ast) {
				this.debug && console.log(ast);

				const result = Traversal.explore(ast, EExpression.evaluate);

				if (result === undefined)
					throw new Error("impossible");

				m.set(i, result)
			}
		}
		return m;
	}


	runAndGetAnswerFromLine(line: string) {
		let index = this.lines.findIndex(x => x == line.trim());

		if (!index)
			throw new Error(`line ${line} was not in source`);

		return this.runAndGetLineNumberToAnswerMap().get(index);
	}

	runAndGetAnswerFromLineNumber(n: number) {
		let index = n;

		let answer = this.runAndGetLineNumberToAnswerMap().get(index);

		if (answer === undefined)
			throw new Error(`line at ${n} was not in source`);

		return answer;
	}

	/**
	* runs the interpreter and logs with possible options.
	*/
	log(options?: { includeLines?: boolean, includeIndexes?: boolean }): void {

		let m = this.runAndGetLineNumberToAnswerMap();

		for (let i of m.keys()) {
			if (options?.includeIndexes) {
				if (options.includeLines) {
					console.log(i, this.lines.at(i) + ":", m.get(i))
				}
				else {
					console.log(i, ":", m.get(i))
				}
			}
			else {
				if (options?.includeLines) {
					console.log(this.lines.at(i) + ":", m.get(i))
				}
				else if (!options?.includeLines) {
					console.log(m.get(i))
				}
			}
		}
	}
}
