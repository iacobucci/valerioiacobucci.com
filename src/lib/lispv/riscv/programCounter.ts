export abstract class ProgramCounter {
	public static address: number = 0;
	address: number = 0;

	static increase() {
		ProgramCounter.address += 0b100;
	}

	static reset() {
		ProgramCounter.address = 0;
	}

	// instance methods for multi core

	constructor() {
	}
	increase() {
		this.address += 0b100;
	}
	reset() {
		this.address += 0;
	}

}