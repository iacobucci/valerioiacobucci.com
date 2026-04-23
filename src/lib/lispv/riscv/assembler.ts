import { DEBUG, DEBUG_ASSEMBLER } from "../flags";
import { Primitives } from "../lang/lib/primitives";
import { Instruction } from "./instruction";
import { Labels } from "./label";
import { Memory } from "./memory";
import { hex } from "./utils";

const debug = DEBUG || DEBUG_ASSEMBLER;

/**
 * parse assembly and write to memory
 */
export class Assembler {
	lines: string[];

	static comment: RegExp = new RegExp("#.*");
	static label: RegExp = new RegExp("\S+:");
	static afterLabel: RegExp = new RegExp(":.*")

	constructor(lines: string[]) {
		this.lines = Primitives.getPrologue().concat(lines);
	}

	/**
	 * @param lines An array of strings representing the instructions in asm.
	 * @param startAddr The address of memory where to start writing.
	 */
	parse(startAddr: number = 0) {
		let lines = this.lines;
		let addr = startAddr;
		let i: Instruction;
		let encoded: number;
		let label: string;
		let line: string;

		// first populate the labels map
		for (let lineNum = 0; lineNum < lines.length; lineNum++) {
			line = lines[lineNum];

			line = line.replace(Assembler.comment, "").trim();

			if (line == "")
				continue;

			if (line.includes(":")) {
				label = line.replace(Assembler.afterLabel, "");
				Labels.set(label, addr)
				continue;
			}

			addr += 4;
		}

		addr = 0;

		// then assemble the instructions, with the right label values
		for (let lineNum = 0; lineNum < lines.length; lineNum++) {
			line = lines[lineNum];

			line = line.replace(Assembler.comment, "").trim();

			if (line == "")
				continue;

			try {
				// but skip labels this time.

				if (line.includes(":"))
					continue;

				i = Instruction.assemble(line);
				i.address = addr;
				debug && console.log(i);
				encoded = i.encode();
				Memory.set(addr, encoded);
				addr += 4;
			}

			catch (e: any) {
				console.error(e);
			}
		}
	}

	log(options?: { lineAddress?: boolean, hidePrologue?: boolean }) {
		let lineAddress = false;
		let hidePrologue = false;
		if (options) {
			lineAddress = options.lineAddress || false;
			hidePrologue = options.hidePrologue || false;
		}

		let addr = 0;
		let startingLine = 0;

		if (hidePrologue) {
			startingLine = this.lines.findIndex(x => x.trim() == "_start:");
			for (let i = 0; i < startingLine; i++) {
				if (!(this.lines[i].indexOf(":") >= 0 || this.lines[i].replace(Assembler.comment, "").trim() == "")) {
					addr += 4;
				}
			}
		}

		for (let i = startingLine; i < this.lines.length; i++) {
			if (this.lines[i].indexOf(":") >= 0 || this.lines[i].replace(Assembler.comment, "").trim() == "") {
				if (lineAddress)
					console.log(`            ` + this.lines[i]);
				else
					console.log(this.lines[i]);
			} else {
				if (lineAddress)
					console.log(`${hex(addr)}: ` + this.lines[i]);
				else
					console.log(this.lines[i]);
				addr += 4;
			}
		}
	}

	static disassemble() {
		let instructions: Instruction[] = [];

		let addr = 0;
		let encoded: number;
		let i: Instruction;

		do {
			encoded = Memory.get(addr);
			i = Instruction.decode(encoded);
			i.address = addr;
			instructions.push(i);
			addr += 4;
		} while (i.tag != "halt");

		return instructions;
	}
}
