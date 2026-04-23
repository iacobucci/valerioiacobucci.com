/**
 * it's realy important to try to parse ranged numbers from the greater to thr lower
 * @param start the `number` to start, included
 * @param end the `number` to end, included
 * @returns a `number[]`
 */
export function range(start: number, end: number) {
	let result: number[] = [];
	for (let i = end; i >= start; i--)
		result.push(i);
	return result
}
