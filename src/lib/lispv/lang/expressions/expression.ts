import { Ast } from "../../parser/ast";
import { Evaluable } from "../evaluable";
import { EApplication } from "./application";
import { ENumber } from "./number";
import { EVariable } from "./variable";

export class EExpression extends Evaluable {
	static parameters(node: Ast): { first_child: Ast, first_child_type: typeof Evaluable, other_childs: Ast[] } {
		if (!node.children)
			throw new Error("no children");

		let first_child = node.children.at(0);

		if (!first_child)
			throw new Error("no first child");

		let first_child_type = first_child.evaluableType;

		if (!first_child_type)
			throw new Error("impossible");

		return { first_child, first_child_type, other_childs: node.children.slice(1) }
	}

	static evaluate(node: Ast): number {

		switch (node.evaluableType) {
			case ENumber: {
				return ENumber.evaluate(node);
			}

			case EVariable: {
				return EVariable.evaluate(node);
			}
		}

		let { first_child, first_child_type } = EExpression.parameters(node);

		switch (first_child_type) {

			case EApplication: {
				return EApplication.evaluate(first_child);
			}

			case EExpression: {
				return EExpression.evaluate(first_child);
			}

			default: {
				return first_child_type.evaluate(first_child);
			}

		}
	}

	static compile(node: Ast): string[] {
		switch (node.evaluableType) {
			case ENumber: {
				return ENumber.compile(node);
			}

			case EVariable: {
				return EVariable.compile(node);
			}
		}

		let { first_child, first_child_type } = EExpression.parameters(node);

		switch (first_child_type) {

			case EApplication: {
				return EApplication.compile(first_child);
			}

			case EExpression: {
				return EExpression.compile(first_child);
			}

			default: {
				return first_child_type.compile(first_child);
			}

		}
	}

}
