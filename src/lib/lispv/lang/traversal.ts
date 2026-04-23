import { Ast } from "../parser/ast";
import { Parser } from "../parser/parser";
import { EExpression } from "./expressions/expression";
import { GRAMMAR, ONE_OR_MORE_SPACES, LBRACKET, RBRACKET, ZERO_OR_MORE_SPACES, OPERATION, APPLICATION_OR_VARIABLE_OR_NUMBER_OR_EXPRESSION, NUMBER, VARIABLE, FUNCTION } from "./grammar";

export class Traversal {
	static cleanLines(lines: string[] | string) {
		if (typeof lines === "string")
			return lines.split("\n").map(x => x.trim()).filter(x => x.trim() != "");
		else
			return lines.map(x => x.trim()).filter(x => x.trim() != "");
	}

	static explore<T>(node: Ast, lambda: (node: Ast) => T): T | undefined {
		if (node.evaluableType === EExpression) {
			return lambda(node);
		}

		for (const child of node.children || []) {
			const res = this.explore(child, lambda);
			if (res !== undefined) return res;
		}

		return undefined;
	}


	static cleanAst(line: string) {

		const p = new Parser(GRAMMAR);

		let result = p.parse(line);

		if (result.matched && result.parsed) {
			let ast = result.parsed.copyAsAst();

			// wipe rules that were added for parsing purposes
			ast.wipe(ONE_OR_MORE_SPACES, LBRACKET, RBRACKET, ZERO_OR_MORE_SPACES)

			// remove picked grammar patterns that are not of use
			ast.simplify(GRAMMAR, OPERATION, APPLICATION_OR_VARIABLE_OR_NUMBER_OR_EXPRESSION);

			// collapse the digits of a number in a node of name number, 
			ast.collapse(NUMBER, VARIABLE, FUNCTION);

			return ast;
		} else if (line.trim() !== "") {
			throw new Error("Syntax error");
		}
	}

}
