import { Ast } from "../../../parser/ast";
import { Primitives } from "../../lib/primitives";
import { EExpression } from "../expression";
import { EOperation } from "../operation";

export class EMinus extends EOperation {

	static jumpLabel(n: number) {
		return `jalr ra, minus-${n}(zero)`;
	}

	static evaluate(node: Ast): number {
		let { other_childs } = EExpression.parameters(node);

		let sum = 0;
		let intermediate: number;

		for (let child of other_childs) {
			intermediate = EExpression.evaluate(child);
			sum -= intermediate;
		}

		return sum;
	}

	static compile(node: Ast): string[] {
		return super.compile(node);
	}

	static generatePrimitive(n: number): string {
		let primitive = `
minus-${n}:
	sub a0, zero, zero
`;
		for (let i = 1; i < n + 1; i++) {
			primitive = primitive.concat(`\tsub a0, a0, a${i}\n`);
		}

		return primitive.concat("\tjal ra, 0")
	}

	static {
		Primitives.addToRegistry(this.primitives());
	}
}
