import { DEBUG, DEBUG_COMPILER } from "../flags";
import { Compiler } from "./compiler";
import { Ast } from "../parser/ast";

export abstract class Evaluable {
	static tag?: string;
	static debug_compiler?: boolean = DEBUG || DEBUG_COMPILER;

	static createAst(literal?: string): Ast {
		if (!this.tag)
			throw new Error("cannot make into ast");

		let ast = new Ast(this.tag, literal);
		ast.evaluableType = this;
		return ast;
	}

	static evaluate(_node: Ast): number {
		throw new Error("not implemented");
	};

	static compile(_node: Ast): string[] {
		throw new Error("not implemented");
	}

	static indentationLevel(node: Ast): number {
		let i = 0;
		for (; node.parent; node = node.parent)
			i++;
		return i;
	}
	
	static indentation(node: Ast): string {
		if (!Compiler.indentation)
			return "\t";
		return "  ".repeat(Evaluable.indentationLevel(node));
	}
}
