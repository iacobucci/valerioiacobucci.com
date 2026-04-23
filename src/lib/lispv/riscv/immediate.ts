import { Label, Labels } from "./label";

export abstract class Immediate {
	abstract bits: any;
	value: number = 0;
	label: Label | undefined;

	static flatten(s: string): { value: number, label: Label | undefined } {
		s = s.trim();

		let label = Labels.get(s)

		if (label) {
			return { value: label.address, label }
		}

		// TODO remove eval
		return { value: Number.parseInt(eval(s.trim())), label: undefined }
	}

	static parse(_s: string): Immediate {
		throw new Error("must do static parsing from concrete Immediate subclass")
	}

	overflows() {
		let max = (1 << (this.bits - 1)) - 1;
		let min = - (1 << (this.bits - 1));

		return (this.value < min || this.value > max);
	}
}

export abstract class UnsignedImmediate extends Immediate {
	overflows() {
		let max = (1 << (this.bits)) - 1;
		let min = 0;

		return (this.value < min || this.value > max);
	}
}

/**
 * signed 12 bit immediate.
 */
export class Immediate5 extends Immediate {
	readonly bits: 5 = 5;
	constructor(value: number) {
		super();
		this.value = value >>> 0;
	}

	static parse(s: string) {
		let { value, label } = Immediate.flatten(s);
		let imm = new Immediate5(value);
		imm.label = label;
		return imm;
	}
}

/**
 * signed 12 bit immediate.
 */
export class Immediate12 extends Immediate {
	readonly bits: 12 = 12;
	constructor(value: number) {
		super();
		this.value = (value & 0x800) ? (value | 0xFFFFF000) : value;
	}

	static parse(s: string) {
		let { value, label } = Immediate.flatten(s);
		let imm = new Immediate12(value);
		imm.label = label;
		return imm;
	}
}

/**
 * unsigned 12 bit immediate.
 */
export class UnsignedImmediate12 extends UnsignedImmediate {
	readonly bits: 12 = 12;
	constructor(value: number) {
		super();
		this.value = value & 0b111111111111;
	}

	static parse(s: string) {
		let { value, label } = Immediate.flatten(s);
		let imm = new UnsignedImmediate12(value);
		imm.label = label;
		return imm;
	}
}

/**
 * signed 20 bit immediate.
 */
export class Immediate20 extends Immediate {
	readonly bits: 20 = 20;
	constructor(value: number) {
		super();
		this.value = (value & 0x80000) ? (value | 0xFFF00000) : value;
	}

	static parse(s: string) {
		let { value, label } = Immediate.flatten(s);
		let imm = new Immediate20(value);
		imm.label = label;
		return imm;
	}
}
