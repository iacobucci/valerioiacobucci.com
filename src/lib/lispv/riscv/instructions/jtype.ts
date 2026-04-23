import { Instruction } from "../instruction"
import { Register, Registers } from "../register";
import { InstructionRegistry } from "../instructionRegistry";
import { Immediate20 } from "../immediate";
import { ProgramCounter } from "../programCounter";

abstract class JTypeInstruction extends Instruction {
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

		// opcode [6:0]
		encoded += this.opcode;
		shift += 7;

		// rd [11:7]
		encoded += this.destination.index << shift;
		shift += 5;

		// imm[19:12] [19:12]
		encoded += ((this.immediate.value >> 12) & 0b11111111) << shift;
		shift += 8;

		// imm[11] [20]
		encoded += ((this.immediate.value >> 11) & 0b1) << shift;
		shift += 1;

		// imm[10:1] [30:21]
		encoded += ((this.immediate.value >> 1) & 0b1111111111) << shift;
		shift += 10;

		// imm[20] [31]
		encoded += ((this.immediate.value >> 20) & 0b1) << shift;

		return encoded;
	}

	static factoryFromBinary(encoded: number): Instruction {
		const rd = (encoded >> 7) & 0b11111;

		// Reconstruct immediate from J-type format:
		// imm[20|10:1|11|19:12] stored as [31|30:21|20|19:12]
		let imm = 0;

		// imm[19:12] from bits [19:12]
		imm |= ((encoded >> 12) & 0b11111111) << 12;

		// imm[11] from bit [20]
		imm |= ((encoded >> 20) & 0b1) << 11;

		// imm[10:1] from bits [30:21]
		imm |= ((encoded >> 21) & 0b1111111111) << 1;

		// imm[20] from bit [31]
		imm |= ((encoded >> 31) & 0b1) << 20;

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
		const destination = Registers.parse(p[0]);
		const immediate = Immediate20.parse(p[1]);

		return new (this as any)(
			destination,
			immediate
		) as Instruction
	}
}

export class JalInstruction extends JTypeInstruction {
	static tag = "jal";
	static opcode = 0b1101111;

	execute(): void {
		ProgramCounter.address = this.destination.value + this.immediate.value - 4;
	}

	static {
		InstructionRegistry.register(this);
	}
}
