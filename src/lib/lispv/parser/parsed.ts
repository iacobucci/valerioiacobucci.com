import { Evaluable } from "../lang/evaluable";
import { Ast } from "./ast";

export class Parsed {
	name: string
	level: number;
	literal?: string;

	children?: Parsed[];
	evaluableType?: typeof Evaluable;

	constructor(name: string, level: number, literal?: string) {
		this.name = name;
		this.level = level;
		this.literal = literal;
		if (!this.literal)
			this.children = [];
	}

	copyAsAst() {
		let result = new Ast(this.name, this.literal);
		result.evaluableType = this.evaluableType;
		result.parent = undefined; // this is the root node

		function explore(original: Parsed, copy: Ast) {
			for (let child of original.children || []) {
				let childAst = new Ast(child.name, child.literal);

				childAst.parent = copy;
				childAst.evaluableType = child.evaluableType;

				if (copy.children)
					copy.children.push(childAst);

				explore(child, childAst);
			}
		}

		explore(this, result);
		return result;
	}

}
