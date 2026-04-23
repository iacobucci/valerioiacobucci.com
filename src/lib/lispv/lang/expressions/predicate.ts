import { Ast } from "../../parser/ast";
import { EExpression } from "./expression";
import { EOperation } from "./operation";

export abstract class EPredicate extends EOperation {
	static predicate(_n1: number, _n2: number): number {
		throw new Error("not implemented");
	}

	static evaluate(node: Ast): number {
		let { other_childs } = EExpression.parameters(node);

		if (other_childs.length != 2)
			throw new Error()

		let o1_node = other_childs.at(0);
		if (!o1_node)
			throw new Error("impossible");

		let o2_node = other_childs.at(1);
		if (!o2_node)
			throw new Error("impossible");

		let n1 = EExpression.evaluate(o1_node);
		let n2 = EExpression.evaluate(o2_node);

		return this.predicate(n1, n2);
	}
}

