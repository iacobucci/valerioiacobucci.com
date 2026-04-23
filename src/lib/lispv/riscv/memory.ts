import { Instruction } from "./instruction";
import { hex, unsigned } from "./utils";

export enum MemoryMode {
	BIG_ENDIAN,
	LITTLE_ENDIAN
}

/**
 * data memory and instruction memory are unified (Von Neumann architecture). the memory is addressed to the byte.
 */
export abstract class Memory {
	private static cells = new Map<number, number>();
	private static writeAccesses = 0;
	private static readAccesses = 0;

	static mode: MemoryMode = MemoryMode.BIG_ENDIAN;

	static clean() {
		Memory.cells = new Map<number, number>();
		Memory.writeAccesses = 0;
	}

	/**
	 * Set a 
	 * @param address the memory address, indexed by the byte.
	 * @param value the little-endian value to store.
	 * @param bytes = 4 by default, can be set to 1, 2, 4.
	 */
	static set(address: number, value: number, bytes: number = 4): void {
		address = address | 0;
		value = value | 0;
		let alignment = address & 0b11;
		let baseAddr = (address >> 2) << 2;
		let word0 = Memory.cells.get(baseAddr) || 0;
		let word1 = Memory.cells.get(baseAddr + 4) || 0;

		switch (alignment) {
			case 0b00: {
				switch (bytes) {
					case 4: {
						Memory.cells.set(baseAddr, value);
						break;
					}
					case 2: {
						Memory.cells.set(baseAddr, (word0 & 0x0000ffff) | (value << 16));
						break;
					}
					case 1: {
						Memory.cells.set(baseAddr, (word0 & 0x00ffffff) | (value << 24));
						break;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
				break;
			}
			case 0b01: {
				switch (bytes) {
					case 4: {
						Memory.cells.set(baseAddr, (word0 & 0xff000000) | (value >>> 8));
						Memory.cells.set(baseAddr + 4, (word1 & 0x00ffffff) | (value << 24));
						break;
					}
					case 2: {
						Memory.cells.set(baseAddr, (word0 & 0xff0000ff) | ((value & 0xffff) << 8));
						break;
					}
					case 1: {
						Memory.cells.set(baseAddr, (word0 & 0xff00ffff) | ((value & 0xff) << 16));
						break;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
				break;
			}
			case 0b10: {
				switch (bytes) {
					case 4: {
						Memory.cells.set(baseAddr, (word0 & 0xffff0000) | (value >>> 16));
						Memory.cells.set(baseAddr + 4, (word1 & 0x0000ffff) | (value << 16));
						break;
					}
					case 2: {
						Memory.cells.set(baseAddr, (word0 & 0xffff0000) | (value & 0xffff));
						break;
					}
					case 1: {
						Memory.cells.set(baseAddr, (word0 & 0xffff00ff) | ((value & 0xff) << 8));
						break;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
				break;
			}
			case 0b11: {
				switch (bytes) {
					case 4: {
						Memory.cells.set(baseAddr, (word0 & 0xffffff00) | (value >>> 24));
						Memory.cells.set(baseAddr + 4, (word1 & 0x000000ff) | (value << 8));
						break;
					}
					case 2: {
						Memory.cells.set(baseAddr, (word0 & 0xffffff00) | ((value >>> 8) & 0xff));
						Memory.cells.set(baseAddr + 4, (word1 & 0x00ffffff) | ((value & 0xff) << 24));
						break;
					}
					case 1: {
						Memory.cells.set(baseAddr, (word0 & 0xffffff00) | (value & 0xff));
						break;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
				break;
			}
		}
		Memory.writeAccesses += 1;
	}

	static getAccesses() {
		return { write: Memory.writeAccesses, read: Memory.readAccesses, total: Memory.writeAccesses + Memory.readAccesses }
	}

	/**
	 * @param address The memory address.
	 * @param bytes The number of bytes to get
	 * @returns The `bytes`-long string of bits, represented by a `number`
	 */
	static get(address: number, bytes: number = 4): number {
		address = address | 0;
		let alignment = address & 0b11;
		let words = [
			Memory.cells.get((address >> 2) << 2) || 0,
			Memory.cells.get(((address + 4) >> 2) << 2) || 0
		];
		Memory.writeAccesses += 1;

		switch (alignment) {
			case 0b00: {
				switch (bytes) {
					case 4: {
						return words[0];
					}
					case 2: {
						return words[0] >>> 16;
					}
					case 1: {
						return words[0] >>> 24;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
			}
			case 0b01: {
				switch (bytes) {
					case 4: {
						return (words[0] << 8) | (words[1] >>> 24);
					}
					case 2: {
						return (words[0] >>> 8) & 0xffff;
					}
					case 1: {
						return (words[0] >>> 16) & 0xff;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
			}
			case 0b10: {
				switch (bytes) {
					case 4: {
						return (words[0] << 16) | (words[1] >>> 16);
					}
					case 2: {
						return words[0] & 0xffff;
					}
					case 1: {
						return (words[0] >>> 8) & 0xff;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
			}
			case 0b11: {
				switch (bytes) {
					case 4: {
						return (words[0] << 24) | (words[1] >>> 8);
					}
					case 2: {
						return ((words[0] << 8) | (words[1] >>> 24)) & 0xffff;
					}
					case 1: {
						return words[0] & 0xff;
					}
					default:
						throw new Error(`cannot index memory by ${bytes} bytes`);
				}
			}
		}
		return 0;
	}

	static show() {
		// show memory addresses sorted
		for (let cell of Array.from(Memory.cells.entries()).sort((a, b) => unsigned(a[0]) - unsigned(b[0]))) {
			let addr = cell[0];
			let value = cell[1];
			let disassembled: string = "";

			try {
				let i: Instruction = Instruction.decode(value);
				disassembled = ` [${i.disassemble()}]`
			}
			catch (e) {

			}
			finally {
				console.log(`${hex(addr)}: ${hex(value)} (${value})${disassembled}`);
			}
		}
	}

	static getCells() {
		return Array.from(Memory.cells.entries()).sort((a, b) => unsigned(a[0]) - unsigned(b[0])).map(([addr, value]) => {
			let disassembled = "";
			try {
				let i: Instruction = Instruction.decode(value);
				disassembled = i.disassemble();
			} catch (e) { }
			return { addr, value, disassembled };
		});
	}
}
