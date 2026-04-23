import { Ast } from "../../../../parser/ast";
import { EExpression } from "../../expression";
import { EPredicate } from "../../predicate";

export class ENot extends EPredicate {
	static predicate(n1: number): number {
		return (n1) ? 0 : 1;
	}

	static evaluate(node: Ast): number {
		let { other_childs } = EExpression.parameters(node);

		if (other_childs.length != 1)
			throw new Error()

		let o1_node = other_childs.at(0);
		if (!o1_node)
			throw new Error("impossible");


		let n1 = EExpression.evaluate(o1_node);

		return this.predicate(n1);
	}
}
