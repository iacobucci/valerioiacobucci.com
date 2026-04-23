import { DEBUG, DEBUG_DECODER } from "../flags";
import { InstructionRegistry } from "./instructionRegistry";
import { ProgramCounter } from "./programCounter";
import { bin, hex } from "./utils";

/**
 * instructions are 4 byte data structures, comprised of an `opcode` and optionally the `f3` and `f7` fields. these are used to differentiate instruction types. the `Instruction` class is extended by concrete classes, that define a `name` for a specific instruction and an `execute()` method that is run during the execution. instructions are fetched from memory as a `number` and decoded to the correct instruction type, that assigns the correct registry or immediate fields. subclasses of `Instruction` must define the `encode()` method that translates the `Instruction` object into the `number` that is stored in memory, and the `static factory(encoded: number)` method, that cares to decode only the registry and immediate fields and instantiate the specific `Instruction` class.
 */

export abstract class Instruction {
	abstract execute(): void;
	abstract encode(): number;
	abstract disassemble(): string;

	static opcode: number = 0;
	static f3: number | undefined = undefined;
	static f7: number | undefined = undefined;
	static tag: string = "";

	address: number | undefined = undefined;

	// get fields for instances
	get opcode(): number {
		return (this.constructor as typeof Instruction).opcode;
	}
	get f3(): number | undefined {
		return (this.constructor as typeof Instruction).f3;
	}
	get f7(): number | undefined {
		return (this.constructor as typeof Instruction).f7;
	}
	get tag(): string {
		return (this.constructor as typeof Instruction).tag;
	}

	/**
	 *	static method to decode the binary representation of the instruction. 
	 */
	static decode(encoded: number): Instruction {
		let opcode = 0;
		let f3: number | undefined = undefined;
		let f7: number | undefined = undefined;

		let key: number;
		let instructionClass: typeof Instruction | undefined;

		let possibleInstructionClass: typeof Instruction | undefined;

		opcode = encoded & 0b1111111;
		key = InstructionRegistry.key(opcode, f3, f7);
		possibleInstructionClass = InstructionRegistry.binaryRegistry.get(key);
		if (possibleInstructionClass)
			instructionClass = possibleInstructionClass;

		f3 = (encoded >> 12) & 0b111;
		key = InstructionRegistry.key(opcode, f3, f7);
		possibleInstructionClass = InstructionRegistry.binaryRegistry.get(key);
		if (possibleInstructionClass)
			instructionClass = possibleInstructionClass;

		f7 = (encoded >> 25) & 0b1111111;
		key = InstructionRegistry.key(opcode, f3, f7);
		possibleInstructionClass = InstructionRegistry.binaryRegistry.get(key);
		if (possibleInstructionClass)
			instructionClass = possibleInstructionClass;

		(DEBUG || DEBUG_DECODER) && (console.log("f7: " + bin(f7, 7), "f3: " + bin(f3, 3), "op: " + bin(opcode, 7)));

		if (!instructionClass) {
			throw new Error(`unknown instruction at ${hex(ProgramCounter.address)} (${hex(encoded)}): opcode=${opcode}, f3=${f3}, f7=${f7}`);
		}

		return (instructionClass as any).factoryFromBinary(encoded);
	}

	static factoryFromBinary(_encoded: number): Instruction {
		throw new Error("factory must be implemented by subclass");
	}

	/**
	 * a static method to parse the assembly line into an object representation.
	 */
	static assemble(line: string): Instruction {
		let tag = line.split(" ")[0];
		let parameters = line.substr(line.indexOf(" ") + 1);

		let instructionClass = InstructionRegistry.tagRegistry.get(tag);

		if (!instructionClass)
			throw new Error(`instruction ${tag} not implemented.`);

		return (instructionClass as any).factoryFromAssembly(parameters);
	}

	static factoryFromAssembly(_parameters: string): Instruction {
		throw new Error("factory must be implemented by subclass");
	}
}

export class HaltInstruction extends Instruction {
	static opcode = 0;
	static tag = "halt";

	execute(): void {
	}

	encode() {
		return 0;
	}

	disassemble(): string {
		return `${this.tag}`;
	}

	constructor() {
		super();
	}

	static factoryFromBinary(_encoded: number): Instruction {
		return new (this as any)() as Instruction;
	}

	static factoryFromAssembly(_parameters: string): Instruction {
		return new HaltInstruction();
	}

	static {
		InstructionRegistry.register(this);
	}
}
