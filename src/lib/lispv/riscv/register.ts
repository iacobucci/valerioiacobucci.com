import { hex } from "./utils";

/**
 * registers are 32 bit sized.
 */
export class Register {
	index: number;
	private _value: number;

	constructor(index: number) {
		this.index = index;
		this._value = 0;
	}

	get value() {
		return this._value;
	}

	set value(value: number) {
		if (this.index != 0)
			this._value = value;
		else
			throw new Error("register i0 hardwired to 0x00000000")
	}

	toString() {
		return "i" + this.index;
	}
}

/**
 * there are 32 cpu registers, indexed with `get(index: number)`, where 0<=`number`<32. 
 */
export abstract class Registers {
	private static registers = new Map<number, Register>();
	private static alias = new Map<string, string>([
		["zero", "i0"], // constant zero
		["ra", "i1"], // return address
		["sp", "i2"], // stack pointer
		["gp", "i3"], // global pointer
		["tp", "i4"], // thread pointer
		["t0", "i5"], // temporary registers
		["t1", "i6"],
		["t2", "i7"],
		["fp", "i8"], // frame pointer
		["s0", "i8"], // saved registers
		["s1", "i9"],
		["a0", "i10"], // function arguments and return values
		["a1", "i11"],
		["a2", "i12"], // function arguments
		["a3", "i13"],
		["a4", "i14"],
		["a5", "i15"],
		["a6", "i16"],
		["a7", "i17"],
		["s2", "i18"], // saved registers
		["s3", "i19"],
		["s4", "i20"],
		["s5", "i21"],
		["s6", "i22"],
		["s7", "i23"],
		["s8", "i24"],
		["s9", "i25"],
		["s10", "i26"],
		["s11", "i27"],
		["t3", "i28"], // temporary registers
		["t4", "i29"],
		["t5", "i30"],
		["t6", "i31"]
	]);

	static {
		for (let i = 0; i < 32; i++) {
			let r = new Register(i);
			Registers.registers.set(r.index, r);
		}
	}

	static clean() {
		for (let i = 0; i < 32; i++) {
			let r = Registers.registers.get(i);
			if (r && i != 0)
				r.value = 0;
		}
	}

	static get(index: number): Register {
		let register = Registers.registers.get(index);

		if (!register) {
			throw new Error(`Register "${index}" not existent.`);
		}

		return register;
	}

	static getAlias(name: string): string | undefined {
		let alias = Registers.alias.get(name.trim());

		if (alias)
			return alias;

		let x = name.match("x([0-9])")
		if (x)
			return "i" + x.slice(1);

		return undefined;
	}

	static parse(name: string): Register {

		let alias = this.getAlias(name);

		if (alias) {
			return this.parse(alias);
		}

		let index = Number.parseInt(name.replace("i", "").trim());

		if (!(index < 32 && index >= 0))
			throw new Error(`Register "${name}" not found.`)


		return Registers.get(index);
	}

	static show() {
		for (let cell of Array.from(Registers.registers.entries()).sort((a, b) => a[0] - b[0])) {
			let num = cell[0];
			let value = cell[1].value;
			let alias: string | undefined;

			alias = Array.from(this.alias).find(x => x[1].replace("i", "") == "" + num)?.at(0) || "";

			if (value != 0)
				console.log(`${num} (${alias}): ${hex(value)} (${value})`);
		}
	}
}
