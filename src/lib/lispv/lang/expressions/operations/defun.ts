import { MAX_ARGUMENTS } from "../../../flags";
import { Ast } from "../../../parser/ast";
import { COMPILER_ENV, FunctionDefinition, INTERPRETER_ENV } from "../../environment";
import { Evaluable } from "../../evaluable";
import { EExpression } from "../expression";
import { ENumber } from "../number";
import { EOperation } from "../operation";
import { EVariable } from "../variable";

export class EDefun extends EOperation {
	static syntax: Evaluable[] = [
		EDefun,
		EVariable,
		EExpression,
		EExpression
	]

	static parameters(node: Ast): { function_name: string, args: string[], definition: Ast } {
		let { other_childs } = EExpression.parameters(node);

		if (other_childs?.length != this.syntax.length - 1)
			throw new Error("syntax: defun <name> (args <variable1 ... variablen>) (<expression>)");

		let function_name_node = other_childs.at(0);

		if (function_name_node?.evaluableType !== EVariable)
			throw new Error("syntax: defun <name> (args <variable1 ... variableN>) (<expression>)");

		let function_name = function_name_node.literal;

		if (!function_name)
			throw new Error("function must have a name");

		let args: string[] = [];

		let function_args_node = other_childs.at(1);

		if (!function_args_node)
			throw new Error("function must have arguments");

		if (!function_args_node.children)
			throw new Error("impossible");

		if (!function_args_node.children[0].children)
			throw new Error("impossible");

		let arg_nodes = function_args_node.children[0].children.slice(1);

		for (let node of arg_nodes) {
			if (!node.literal)
				throw new Error("argument must have a name");

			args.push(node.literal);
		}

		let definition = other_childs.at(2);

		if (!definition)
			throw new Error("function must have a definition");

		return { function_name, args, definition };
	}

	static evaluate(node: Ast): number {

		let { function_name, args, definition } = this.parameters(node);

		function explore(a: Ast) {

			if (a.evaluableType == EVariable) {
				let variable_name = a.literal as string;

				let found_value = INTERPRETER_ENV.variables.find(variable_name)

				if (found_value) {
					a.evaluableType = ENumber;
					a.name = ENumber.tag as string;
					a.literal = found_value + "";
				}
			}

			for (let child of a.children || []) {
				explore(child);
			}
		}

		explore(definition);

		let func = new FunctionDefinition(function_name, args, definition);

		INTERPRETER_ENV.functions.set(function_name, func);

		return args.length;
	}

	static compile(node: Ast): string[] {

		let { function_name, args, definition } = this.parameters(node);
		let indentation = this.indentation(node);

		let func = new FunctionDefinition(function_name, args, new Ast("body"));

		COMPILER_ENV.functions.set(function_name, func);
		COMPILER_ENV.definingFunction = func;
		COMPILER_ENV.inDefinition = true;

		let asm: string[] = [];

		let argn = args.length;

		if (argn > MAX_ARGUMENTS)
			throw new Error(`cant have more than ${MAX_ARGUMENTS} arguments`);

		// jump to end
		asm.push(`${indentation}jal zero, end-${function_name}`)

		// label
		asm.push(`${function_name}:`)

		// saving
		let offset = (argn + 1) * 4;
		asm.push(`${indentation}addi sp, sp, -${offset}`);
		offset = offset - 4;
		asm.push(`${indentation}sw ra, ${offset}(sp)`);
		offset = offset - 4;

		for (let i = argn; offset >= 0; offset -= 4, i--) {
			asm.push(`${indentation}sw a${i}, ${offset}(sp)`);
		}

		// a-indexes are assigned to the variable, in this level.
		for (let i = 0; i < args.length; i++) {
			COMPILER_ENV.variables.set(args[i], i + 1);
		}

		// temporary registers for calling other functions. they need to be restored after a function is called.
		for (let i = 1; i < argn + 1; i++)
			asm.push(`${indentation}add t${i}, zero, a${i}`)

		// definition
		asm = asm.concat(EExpression.compile(definition));

		offset = (argn + 1) * 4;
		offset = offset - 4;
		asm.push(`${indentation}lw ra, ${offset}(sp)`);
		offset = offset - 4;

		for (let i = argn; offset >= 0; offset -= 4, i--) {
			asm.push(`${indentation}lw a${i}, ${offset}(sp)`);
		}

		asm.push(`${indentation}addi sp, sp, ${(argn + 1) * 4}`);

		// returning

		asm.push(`${indentation}jal ra, 0`);

		asm.push(`end-${function_name}:`)
		asm.push(`${indentation}addi a0, zero, ${argn}`);



		COMPILER_ENV.inDefinition = false;

		return asm;
	}
}
