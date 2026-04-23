export class Primitives {
	private static registry: string[] = [];

	static addToRegistry(asm: string[] | string) {
		if (typeof asm === "string")
			asm = asm.split("\n").filter(x => x.trim() != "");
		this.registry = this.registry.concat(asm);
	}

	static getPrologue() {
		return [
			"jal zero, _start",
			...this.registry,
			"_start:"
		]
	}

}