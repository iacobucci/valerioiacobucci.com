import { Instruction } from "../instruction"
import { InstructionRegistry } from "../instructionRegistry";
import { Register, Registers } from "../register";
import { unsigned } from "../utils";

abstract class RTypeInstruction extends Instruction {
	destination: Register;
	source1: Register;
	source2: Register;
	static opcode = 0b0110011;

	constructor(destination: Register, source1: Register, source2: Register) {
		super();
		this.destination = destination;
		this.source1 = source1;
		this.source2 = source2;
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
		encoded += this.source1.index << shift;
		shift += 5;
		encoded += this.source2.index << shift;
		shift += 5;
		encoded += (this.f7 || 0) << shift;
		return encoded;
	}

	static factoryFromBinary(encoded: number): Instruction {
		const rd = (encoded >> 7) & 0b11111;
		const rs1 = (encoded >> 15) & 0b11111;
		const rs2 = (encoded >> 20) & 0b11111;

		return new (this as any)(
			Registers.get(rd),
			Registers.get(rs1),
			Registers.get(rs2)
		) as Instruction;
	}

	disassemble(): string {
		return `${this.tag} ${this.destination}, ${this.source1}, ${this.source2}`
	}

	static factoryFromAssembly(parameters: string): Instruction {
		let p = parameters.split(",");
		const destination = Registers.parse(p[0])
		const source1 = Registers.parse(p[1]);
		const source2 = Registers.parse(p[2]);

		return new (this as any)(
			destination,
			source1,
			source2
		) as Instruction;
	}
}

// would have liked to use this as a decorator, but jest doesn't seem to work well with it
// @InstructionRegistry.register
export class AddInstruction extends RTypeInstruction {
	static tag = "add";

	execute(): void {
		this.destination.value = this.source1.value + this.source2.value;
	}
	static {
		InstructionRegistry.register(this);
	}
}

export class SubInstruction extends RTypeInstruction {
	static tag = "sub";
	static f7 = 0b0100000;

	execute(): void {
		this.destination.value = this.source1.value - this.source2.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SllInstruction extends RTypeInstruction {
	static tag = "sll";
	static f3 = 0b001;

	execute(): void {
		let amount = unsigned(this.source2.value & 0b11111);
		this.destination.value = this.source1.value << amount;
	}
	static {
		InstructionRegistry.register(this);
	}
}

export class SltInstruction extends RTypeInstruction {
	static tag = "slt";
	static f3 = 0b010;

	execute(): void {
		this.destination.value = this.source1.value + this.source2.value;
	}
	static {
		InstructionRegistry.register(this);
	}
}

export class SltuInstruction extends RTypeInstruction {
	static tag = "sltu";
	static f3 = 0b011;

	execute(): void {
		this.destination.value = this.source1.value + this.source2.value;
	}
	static {
		InstructionRegistry.register(this);
	}
}

export class XorInstruction extends RTypeInstruction {
	static tag = "xor";
	static f3 = 0b100;

	execute(): void {
		this.destination.value = this.source1.value ^ this.source2.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class SrlInstruction extends RTypeInstruction {
	static tag = "srl";
	static f3 = 0b101;

	execute(): void {
		let amount = unsigned(this.source2.value & 0b11111);
		this.destination.value = this.source1.value >> amount;
	}
	static {
		InstructionRegistry.register(this);
	}
}

export class SraInstruction extends RTypeInstruction {
	static tag = "sra";
	static f3 = 0b101;
	static f7 = 0b0100000;

	execute(): void {
		let amount = unsigned(this.source2.value & 0b11111);
		this.destination.value = this.source1.value >>> amount;
	}
	static {
		InstructionRegistry.register(this);
	}
}


export class OrInstruction extends RTypeInstruction {
	static tag = "or";
	static f3 = 0b110;

	execute(): void {
		this.destination.value = this.source1.value | this.source2.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}

export class AndInstruction extends RTypeInstruction {
	static tag = "and";
	static f3 = 0b111;

	execute(): void {
		this.destination.value = this.source1.value & this.source2.value;
	}

	static {
		InstructionRegistry.register(this);
	}
}
