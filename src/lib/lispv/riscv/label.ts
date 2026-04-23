import { hex } from "./utils";

export interface Label {
	name: string;
	address: number;
}

export class Labels {
	static labels: Map<string, Label> = new Map<string, Label>();

	static set(name: string, address: number) {
		let l: Label = { name, address };
		Labels.labels.set(name, l);
	}

	static get(name: string) {
		return Labels.labels.get(name);
	}

	static show() {
		for (let cell of Array.from(Labels.labels.entries()).sort((a, b) => a[1].address - b[1].address)) {
			let name = cell[0];
			let addr = cell[1].address;

			console.log(`${name}: ${hex(addr)}`);
		}
	}
}