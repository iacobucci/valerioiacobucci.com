import { Instruction } from "./instruction";

export class InstructionRegistry {
	static binaryRegistry = new Map<number, typeof Instruction>();
	static tagRegistry = new Map<string, typeof Instruction>();

	private constructor() { }

	static key(opcode: number, f3: number | undefined, f7: number | undefined): number {
		const f3Val = f3 ?? 0;
		const f7Val = f7 ?? 0;
		return (f7Val << 10) | (f3Val << 7) | opcode;
	}

	static register(f: Function) {
		const i = f as typeof Instruction;
		const key = InstructionRegistry.key(i.opcode, i.f3, i.f7);

		InstructionRegistry.binaryRegistry.set(key, i);
		InstructionRegistry.tagRegistry.set(i.tag, i);
	}
}
