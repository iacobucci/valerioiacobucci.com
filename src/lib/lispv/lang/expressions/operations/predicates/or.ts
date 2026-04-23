import { EPredicate } from "../../predicate";

export class EOr extends EPredicate {
	static predicate(n1: number, n2: number): number {
		return (n1 || n2);
	}
}
