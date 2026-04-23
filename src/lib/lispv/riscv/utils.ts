/**
 * @param num the `number` to represent in binary form
 * @param bits the optional `number` of binary digits to print, so the 
 * @returns a `string` that is the binary representation of `num`
 */
export function bin(num: number, bits?: number): string {
	let s = (num >>> 0).toString(2);
	if (!bits)
		return s;
	return "0".repeat(bits - s.length) + (num >>> 0).toString(2);
}

/**
 * @param n the `number` to hex.
 * @returns the hexadecimal representation of `n`, treated as **unsigned**.
 */
export function hex(n: number) {
	return "0x" + (n >>> 0).toString(16).padStart(8, '0'); // Unsigned per hex
}

/**
 * flip from big endian to little endian and vice versa
 * @param n the `number` to flip
 * @returns the `number` representation of n flipped
 */
export function flipEndianness(n: number) {
	let n0 = n & 0xff
	let n1 = (n & 0xff00) >>> 8
	let n2 = (n & 0xff0000) >>> 16
	let n3 = (n & 0xff000000) >>> 24

	return n0 << 24 | n1 << 16 | n2 << 8 | n3
}

export function unsigned(n: number) {
	return n >>> 0;
}

export function signExtend(n: number, b: number) {
	let last_bit = (n & (1 << b - 1));
	for (let i = b; i < 32; i++) {
		n += (last_bit << i);
	}
	return n;
}