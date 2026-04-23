import { Ast } from "../../../parser/ast";
import { COMPILER_ENV } from "../../environment";
import { EExpression } from "../expression";
import { EOperation } from "../operation";

export class EIf extends EOperation {
	static parameters(node: Ast): { condition_node: Ast, expression_if_true: Ast, expression_if_false: Ast } {
		let { other_childs } = EExpression.parameters(node);

		if (other_childs.length != 3)
			throw new Error("syntax: if (<condition>) <expression if true> <expression if false>")

		let condition_node = other_childs.at(0);

		if (!condition_node)
			throw new Error("if expression must have a condition")

		let expression_if_true = other_childs.at(1);

		if (!expression_if_true)
			throw new Error("if expression must have an expression if true")

		let expression_if_false = other_childs.at(2);

		if (!expression_if_false)
			throw new Error("if expression must have an expression if false")

		return { condition_node, expression_if_true, expression_if_false };
	}

	static evaluate(node: Ast): number {
		let { condition_node, expression_if_true, expression_if_false } = this.parameters(node);

		let condition = EExpression.evaluate(condition_node);

		let result_node: Ast | undefined;

		if (condition) {
			result_node = expression_if_true;
		} else {
			result_node = expression_if_false;
		}

		if (!result_node)
			throw new Error("if expression must have a result")

		return EExpression.evaluate(result_node);
	}

	static compile(node: Ast): string[] {
		let { condition_node, expression_if_true, expression_if_false } = this.parameters(node);
		let indentation = this.indentation(node);

		let asm: string[] = [];

		this.debug_compiler && asm.push(`${indentation}# ` + node.getText(true))

		COMPILER_ENV.ifId++;

		asm = asm.concat(EExpression.compile(condition_node));

		asm.push(`${indentation}bne a0, zero, if-true-${COMPILER_ENV.ifId}`)
		asm.push(`${indentation}jal zero, if-false-${COMPILER_ENV.ifId}`)

		this.debug_compiler && asm.push(`${indentation}# ` + expression_if_true.getText(true))
		asm.push(`if-true-${COMPILER_ENV.ifId}:`)

		asm = asm.concat(EExpression.compile(expression_if_true));

		asm.push(`${indentation}jal zero, if-end-${COMPILER_ENV.ifId}`)

		this.debug_compiler && asm.push(`${indentation}# ` + expression_if_false.getText(true))
		asm.push(`if-false-${COMPILER_ENV.ifId}:`)

		asm = asm.concat(EExpression.compile(expression_if_false));

		asm.push(`if-end-${COMPILER_ENV.ifId}:`)

		return asm;
	}
}
