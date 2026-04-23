import { MAX_ARGUMENTS } from "../../../flags";
import { Ast } from "../../../parser/ast";
import { COMPILER_ENV, Environment, FunctionDefinition, INTERPRETER_ENV } from "../../environment";
import { EExpression } from "../expression";
import { EOperation } from "../operation";

export class EFunction extends EOperation {

	static parameters(node: Ast, env: Environment): { func: FunctionDefinition, args_nodes: Ast[] } {

		let { first_child, other_childs } = EExpression.parameters(node);

		let function_name = first_child.literal;

		if (!function_name)
			throw new Error("<function> must have a name");

		// functions are in a global environment. we dont make a distinction between closures.
		let func = env.functions.get(function_name);

		if (!func)
			throw new Error(`function ${function_name} undefined`);

		let args_nodes = other_childs;


		return { func, args_nodes };
	}

	static evaluate(node: Ast): number {

		let { func, args_nodes } = this.parameters(node, INTERPRETER_ENV);

		// since we are applying a function, we should create an isolated environment for the new parameter-argument associations
		INTERPRETER_ENV.variables.push();

		// here we match parameters with arguments. excess arguments are ignored
		for (let i = 0; i < args_nodes.length; i++) {
			// the function parameter, as defined in the signature
			let parameter_name = func.params[i];

			// if the parameter name is in the space of the defined functions
			if (!INTERPRETER_ENV.functions.get(args_nodes[i].literal || "")) {
				let value = EExpression.evaluate(args_nodes[i]);

				// in the current scope we are assigning variables to their values
				INTERPRETER_ENV.variables.set(parameter_name, value);
			} else {
				let new_name = args_nodes[i].literal || "";
				let updated_func = (INTERPRETER_ENV.functions.get(new_name) as FunctionDefinition);
				updated_func.name = func.params[i];
				// add a new function to GLOBAL scope that is named as the parameter and has the definition that the argument provides.
				// TODO dont make it global
				INTERPRETER_ENV.functions.set(func.params[i], updated_func);
			}
		}

		let result = EExpression.evaluate(func.definition);

		// release the parameter-argument associations
		INTERPRETER_ENV.variables.pop();

		return result;
	}

	static compile(node: Ast): string[] {
		let asm: string[] = [];

		let { func, args_nodes } = this.parameters(node, COMPILER_ENV);
		let indentation = this.indentation(node);

		let leaf_call = true;
		for (let child of args_nodes)
			if (child.evaluableType == EExpression)
				leaf_call = false;

		let argn = args_nodes.length;

		if (!leaf_call) {
			asm.push(`${indentation}addi sp, sp, -${argn * 4}`);
			COMPILER_ENV.saveOnStack = true;
		}

		this.debug_compiler && asm.push(`${indentation}# op ${node.getText(true)}`)

		COMPILER_ENV.push(argn);

		// go through arguments backwards

		for (let i = argn - 1; i >= 0; i--) {
			// the function parameter, as defined in the signature
			let parameter_name = func.params[i];

			// if the parameter name is in the space of the defined functions
			let arg = args_nodes[i].literal;

			if (!COMPILER_ENV.functions.get(arg || "")) {

				asm.push(`${indentation}# ${parameter_name}: ${arg || "nested call"}`)

				asm = asm.concat(EExpression.compile(args_nodes[i]));

				if (!leaf_call) {
					let r = COMPILER_ENV.get() as number;
					asm.push(`${indentation}sw a${r}, ${(r - 1) * 4}(sp)`)
				}

				COMPILER_ENV.decrease();

			} else {
				// TODO passing functions
			}
		}

		COMPILER_ENV.pop();

		// call
		if (!leaf_call) {
			for (let i = 1; i <= argn; i++)
				asm.push(`${indentation}sw t${i}, ${(i - 1) * 4}(sp)`)
		}
		asm.push(`${indentation}jalr ra, ${func.name}(zero)`);

		if (!leaf_call) {
			for (let i = 1; i <= argn; i++)
				asm.push(`${indentation}lw t${i}, ${(i - 1) * 4}(sp)`)
		}

		let destination_register = COMPILER_ENV.get();

		if (destination_register != 0)
			asm.push(`${indentation}add a${destination_register}, zero, a0`);

		if (!leaf_call) {
			asm.push(`${indentation}addi sp, sp, ${argn * 4}`);
			COMPILER_ENV.saveOnStack = false;
		}

		if (COMPILER_ENV.inDefinition) {
			// restore t-registers, please

			let n = MAX_ARGUMENTS;

			let defining_function = COMPILER_ENV.definingFunction;

			if (defining_function)
				n = defining_function.params.length;

			for (let i = 1; i < n; i++)
				asm.push(`${indentation}lw t${i}, ${(i - 1) * 4}(sp)`)

		}

		return asm;
	}
}

