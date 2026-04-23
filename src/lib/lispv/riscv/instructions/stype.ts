import { Instruction } from "../instruction"
import { Register, Registers } from "../register";
import { Memory } from "../memory";
import { InstructionRegistry } from "../instructionRegistry";
import { Immediate12 } from "../immediate";
import { DEBUG_PIPELINE_LOG_STORE } from "../../flags";
import { hex } from "../utils";
import { ProgramCounter } from "../programCounter";

abstract class STypeInstruction extends Instruction {
	source1: Register; // add to this the immediate, that's the address to store in memory
	source2: Register; // the value to store in memory
	immediate: Immediate12;
	static opcode = 0b0100011;

	constructor(source2: Register, source1: Register, immediate: Immediate12) {
		super();
		this.source1 = source1;
		this.source2 = source2;
		this.immediate = immediate;
	}

	encode(): number {
		let encoded = 0;
		let shift = 0;

		// opcode [6:0]
		encoded += this.opcode;
		shift += 7;

		// imm[4:0] [11:7]
		encoded += (this.immediate.value & 0b11111) << shift;
		shift += 5;

		// funct3 [14:12]
		encoded += (this.f3 || 0) << shift;
		shift += 3;

		// rs1 [19:15]
		encoded += this.source1.index << shift;
		shift += 5;

		// rs2 [24:20]
		encoded += this.source2.index << shift;
		shift += 5;

		// imm[11:5] [31:25] - shift right by 5 to get the high bits
		encoded += ((this.immediate.value >> 5) & 0b1111111) << shift;

		return encoded;
	}

	static factoryFromBinary(encoded: number): Instruction {
		const rs2 = (encoded >> 20) & 0b11111;
		const rs1 = (encoded >> 15) & 0b11111;

		// Reconstruct immediate: imm[4:0] from bits [11:7], imm[11:5] from bits [31:25]
		const imm_low = (encoded >> 7) & 0b11111;
		const imm_high = (encoded >> 25) & 0b1111111;
		const imm = imm_low | (imm_high << 5);

		return new (this as any)(
			Registers.get(rs2),
			Registers.get(rs1),
			new Immediate12(imm)
		) as Instruction;
	}

	disassemble(): string {
		return `${this.tag} ${this.source2}, ${this.immediate.value}(${this.source1})`
	}

	static factoryFromAssembly(parameters: string): Instruction {
		let p = parameters.split(",");
		const source2 = Registers.parse(p[0]);
		const others = p[1].split("(");
		const imm = Immediate12.parse(others[0]);
		const source1 = Registers.parse(others[1].replace(")", ""));

		return new (this as any)(
			source2,
			source1,
			imm
		) as Instruction
	}
}

export class SbInstruction extends STypeInstruction {
	static tag = "sb";
	static f3 = 0b000;

	execute(): void {
		Memory.set(this.source1.value + this.immediate.value, this.source2.value & 0xff, 1);
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class ShInstruction extends STypeInstruction {
	static tag = "sh";
	static f3 = 0b001;

	execute(): void {
		Memory.set(this.source1.value + this.immediate.value, this.source2.value & 0xffff, 2);
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SwInstruction extends STypeInstruction {
	static tag = "sw";
	static f3 = 0b010;

	execute(): void {
		let addr = this.source1.value + this.immediate.value;
		let value = this.source2.value;
		DEBUG_PIPELINE_LOG_STORE && console.log(`storing: ${hex(addr)}: ${hex(value)} (pc: ${hex(ProgramCounter.address)})`)
		Memory.set(addr, value);
	}

	static {
		InstructionRegistry.register(this);
	}
}
