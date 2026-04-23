import { hex, signExtend, unsigned } from "../utils";
import { Instruction } from "../instruction"
import { Register, Registers } from "../register";
import { Memory } from "../memory";
import { ProgramCounter } from "../programCounter";
import { InstructionRegistry } from "../instructionRegistry";
import { Immediate12, Immediate5 } from "../immediate";
import { DEBUG_PIPELINE_LOG_STACK_POINTER } from "../../flags";

abstract class ITypeInstruction extends Instruction {
	destination: Register;
	source: Register;
	immediate: Immediate12;

	constructor(destination: Register, source: Register, immediate: Immediate12) {
		super();
		this.destination = destination;
		this.source = source;
		this.immediate = immediate;
	}

	encode(): number {
		let encoded = 0;
		let shift = 0;
		encoded += this.opcode;
		shift += 7;
		encoded += this.destination.index << shift;
		shift += 5;
		encoded += (this.f3 || 0) << shift;
		shift += 3;
		encoded += this.source.index << shift;
		shift += 5;
		encoded += this.immediate.value << shift;
		return encoded;
	}


	static factoryFromBinary(encoded: number): Instruction {
		const rd = (encoded >> 7) & 0b11111;
		const rs = (encoded >> 15) & 0b11111;
		const imm = (encoded >> 20) & ((1 << 12) - 1);

		return new (this as any)(
			Registers.get(rd),
			Registers.get(rs),
			new Immediate12(imm)
		) as Instruction;
	}

	disassemble(): string {
		return `${this.tag} ${this.destination}, ${this.immediate.value}(${this.source})`
	}

	static factoryFromAssembly(parameters: string): Instruction {
		let p = parameters.split(",");
		const destination = Registers.parse(p[0]);

		const others = p[1].split("(");
		const immediate = Immediate12.parse(others[0]);
		const source = Registers.parse(others[1].replace(")", ""));

		return new (this as any)(
			destination,
			source,
			immediate
		) as Instruction
	}
}

export class JalrInstruction extends ITypeInstruction {
	static tag = "jalr";
	static opcode = 0b1100111;

	execute(): void {
		let current_address = ProgramCounter.address

		ProgramCounter.address = (this.source.value + this.immediate.value) - 4

		this.destination.value = current_address + 4;
	}

	static {
		InstructionRegistry.register(this);
	}
}

abstract class MemoryLoadInstruction extends ITypeInstruction {
	static opcode = 0b0000011;
}

export class LbInstruction extends MemoryLoadInstruction {
	static tag = "lb";
	static f3 = 0b000;

	execute(): void {
		this.destination.value = signExtend(Memory.get(this.source.value + this.immediate.value, 1), 8);
	}

	static {
		InstructionRegistry.register(this);
	}
}


export class LhInstruction extends MemoryLoadInstruction {
	static tag = "lh";
	static f3 = 0b001;

	execute(): void {
		this.destination.value = signExtend(Memory.get(this.source.value + this.immediate.value, 2), 16);
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class LwInstruction extends MemoryLoadInstruction {
	static tag = "lw";
	static f3 = 0b010;

	execute(): void {
		this.destination.value = Memory.get(this.source.value + this.immediate.value);
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class LbuInstruction extends MemoryLoadInstruction {
	static tag = "lbu";
	static f3 = 0b000;

	execute(): void {
		this.destination.value = Memory.get(this.source.value + this.immediate.value, 1);
	}

	static {
		InstructionRegistry.register(this);
	}
}


export class LhuInstruction extends MemoryLoadInstruction {
	static tag = "lhu";
	static f3 = 0b001;

	execute(): void {
		this.destination.value = Memory.get(this.source.value + this.immediate.value, 2);
	}

	static {
		InstructionRegistry.register(this);
	}
}

abstract class IntegerRegisterImmediateInstruction extends ITypeInstruction {
	static opcode = 0b0010011;

	static factoryFromAssembly(parameters: string): Instruction {
		let p = parameters.split(",");
		const destination = Registers.parse(p[0])
		const source1 = Registers.parse(p[1]);
		const immediate = Immediate12.parse(p[2]);

		return new (this as any)(
			destination,
			source1,
			immediate
		) as Instruction;
	}

	disassemble(): string {
		return `${this.tag} ${this.destination}, ${this.source}, ${this.immediate.value}`
	}
}

export class AddiInstruction extends IntegerRegisterImmediateInstruction {
	static tag = "addi";

	execute(): void {
		// stack pointer
		if (this.destination.index == 2) {
			DEBUG_PIPELINE_LOG_STACK_POINTER && console.log(`stack pointer: ${hex(this.destination.value)} (pc: ${hex(ProgramCounter.address)})`)
		}
		this.destination.value = this.source.value + this.immediate.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SltiInstruction extends IntegerRegisterImmediateInstruction {
	static tag = "slti";
	static f3 = 0b010;

	execute(): void {
		this.destination.value = (this.source.value < this.immediate.value) ? 1 : 0
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SltiuInstruction extends IntegerRegisterImmediateInstruction {
	static tag = "sltiu";
	static f3 = 0b011;

	execute(): void {
		this.destination.value = (unsigned(this.source.value) < unsigned(this.immediate.value)) ? 1 : 0
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class XoriInstruction extends IntegerRegisterImmediateInstruction {
	static tag = "xori";
	static f3 = 0b100;

	execute(): void {
		this.destination.value = this.source.value ^ signExtend(this.immediate.value, this.immediate.bits);
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class OriInstruction extends IntegerRegisterImmediateInstruction {
	static tag = "ori";
	static f3 = 0b110;

	execute(): void {
		this.destination.value = this.source.value | signExtend(this.immediate.value, this.immediate.bits);
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class AndiInstruction extends IntegerRegisterImmediateInstruction {
	static tag = "andi";
	static f3 = 0b111;

	execute(): void {
		this.destination.value = this.source.value & signExtend(this.immediate.value, this.immediate.bits);
	}

	static {
		InstructionRegistry.register(this);
	}
}

abstract class ShamtInstruction extends Instruction {
	destination: Register;
	source: Register;
	shamt: Immediate5; // 5 bit: 0-31

	constructor(destination: Register, source: Register, shamt: Immediate5) {
		super();
		this.destination = destination;
		this.source = source;
		this.shamt = shamt;
	}

	encode(): number {
		let encoded = 0;
		let shift = 0;

		// opcode (7 bit)
		encoded += this.opcode;
		shift += 7;

		// rd (5 bit)
		encoded += this.destination.index << shift;
		shift += 5;

		// funct3 (3 bit)
		encoded += (this.f3 || 0) << shift;
		shift += 3;

		// rs1 (5 bit)
		encoded += this.source.index << shift;
		shift += 5;

		// shamt (5 bit)
		encoded += this.shamt.value << shift;
		shift += 5;

		// funct7 (7 bit)
		encoded += (this.f7 || 0) << shift;

		return encoded;
	}

	static factoryFromBinary(encoded: number): Instruction {
		const rd = (encoded >> 7) & 0b11111;
		const rs1 = (encoded >> 15) & 0b11111;
		const shamt = (encoded >> 20) & 0b11111;

		return new (this as any)(
			Registers.get(rd),
			Registers.get(rs1),
			new Immediate5(shamt)
		) as Instruction;
	}

	disassemble(): string {
		return `${this.tag} ${this.destination}, ${this.source}, ${this.shamt}`;
	}

	static factoryFromAssembly(parameters: string): Instruction {
		const p = parameters.split(",").map(s => s.trim());
		const destination = Registers.parse(p[0]);
		const source = Registers.parse(p[1]);
		const shamt = Immediate5.parse(p[2]);

		return new (this as any)(
			destination,
			source,
			shamt
		) as Instruction;
	}
}

export class SlliInstruction extends ShamtInstruction {
	static tag = "slli";
	static f3 = 0b001;

	execute(): void {
		this.destination.value = this.source.value << this.shamt.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SrliInstruction extends ShamtInstruction {
	static tag = "srli";
	static f3 = 0b101;

	execute(): void {
		this.destination.value = this.source.value >>> this.shamt.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SraiInstruction extends ShamtInstruction {
	static tag = "srai";
	static f3 = 0b101;
	static f7 = 0b0100000;

	execute(): void {
		this.destination.value = this.source.value >> this.shamt.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}
