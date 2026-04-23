import { Instruction } from "../instruction"
import { Register, Registers } from "../register";
import { Memory } from "../memory";
import { InstructionRegistry } from "../instructionRegistry";
import { Immediate20 } from "../immediate";

abstract class UTypeInstruction extends Instruction {
	destination: Register;
	immediate: Immediate20;

	constructor(destination: Register, immediate: Immediate20) {
		super();
		this.destination = destination;
		this.immediate = immediate;
	}

	encode(): number {
		let encoded = 0;
		let shift = 0;
		encoded += this.opcode;
		shift += 7;
		encoded += this.destination.index << shift;
		shift += 5;
		encoded += this.immediate.value << shift;
		return encoded;
	}

	static factoryFromBinary(encoded: number): Instruction {
		const rd = (encoded >> 7) & 0b11111;
		const imm = (encoded >> 12);

		return new (this as any)(
			Registers.get(rd),
			new Immediate20(imm)
		) as Instruction;
	}

	disassemble(): string {
		return `${this.tag} ${this.destination}, ${this.immediate.value}`
	}

	static factoryFromAssembly(parameters: string): Instruction {
		let p = parameters.split(",");
		const source1 = Registers.parse(p[0]);
		const source2 = Registers.parse(p[1]);
		const immediate = Immediate20.parse(p[2]);

		return new (this as any)(
			source1,
			source2,
			immediate
		) as Instruction
	}
}

export class LuiInstruction extends UTypeInstruction {
	static tag = "lui";
	static opcode = 0b0110111;

	execute(): void {

	}

	static {
		InstructionRegistry.register(this);
	}
}

export class AuipcInstruction extends UTypeInstruction {
	static tag = "auipc";
	static opcode = 0b0010111;

	execute(): void {

	}

	static {
		InstructionRegistry.register(this);
	}
}