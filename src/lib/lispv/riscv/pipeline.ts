import { Instruction } from "./instruction";
import { Memory } from "./memory";
import { ProgramCounter } from "./programCounter";
import { Registers, Register } from "./register";
import { DEBUG, DEBUG_PIPELINE, DEBUG_PIPELINE_DUMP_MEMORY_AT_EVERY_CYCLE, DEBUG_PIPELINE_DUMP_REGISTERS_AT_EVERY_CYCLE, DEBUG_PIPELINE_LOG_STACK_POINTER, DEBUG_PIPELINE_LOG_STORE } from "../flags";
import { hex } from "./utils";

const debug = DEBUG || DEBUG_PIPELINE || DEBUG_PIPELINE_DUMP_MEMORY_AT_EVERY_CYCLE || DEBUG_PIPELINE_DUMP_REGISTERS_AT_EVERY_CYCLE || DEBUG_PIPELINE_LOG_STORE || DEBUG_PIPELINE_LOG_STACK_POINTER;

export class Pipeline {
	/**
	 * Start fetching from `Memory` at `ProgramCounter.address`, decode instructions with `static Instruction.decode(number)`, execute them immediately with `Instruction.execute()`. stop when an `HaltInstruction` is found.
	 */

	static init() {
		Memory.clean()
		Registers.clean();
		ProgramCounter.reset();
	}

	static run(maxIterations?: number) {

		let iter: number = 0;
		let addr: number;
		let encoded: number;
		let i: Instruction;

		do {
			// fetch
			addr = ProgramCounter.address;
			encoded = Memory.get(addr);

			// decode. if the decoding fails the simulator crashes.
			debug && console.log(`decoding: ${hex(ProgramCounter.address)}: ${hex(encoded)}`);
			i = Instruction.decode(encoded);
			i.address = ProgramCounter.address
			debug && console.log(`decoded: ${hex(ProgramCounter.address)}: ${i.disassemble()}`);

			// execute, memory, writeback
			i.execute();
			ProgramCounter.increase()

			DEBUG_PIPELINE_DUMP_MEMORY_AT_EVERY_CYCLE && Memory.show();
			DEBUG_PIPELINE_DUMP_REGISTERS_AT_EVERY_CYCLE && Registers.show();

			iter++;
		} while (i.tag != "halt" && (maxIterations ? iter < maxIterations : true));

		debug && console.log("run finished at", Date(), `with ${Memory.getAccesses().total} accesses(r: ${Memory.getAccesses().read}, w: ${Memory.getAccesses().write}), in ${iter} iterations.`);

	}
}
