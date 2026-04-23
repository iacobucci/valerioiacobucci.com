import { Environment } from "../lang/environment";
import { Evaluable } from "../lang/evaluable";
import { Rule } from "./rule";

export class Ast {
	name: string;
	literal?: string;
	parent?: Ast;
	children?: Ast[];
	environment?: Environment;
	evaluableType?: typeof Evaluable;

	constructor(name: string, literal?: string) {
		this.name = name;
		this.literal = literal;
		if (!this.literal)
			this.children = [];
	}

	// chain method
	addChildren(children: Ast[]): Ast {
		this.children = children;
		return this;
	}

	/**
	 * wipe rules off of the AST, together with its children.
	 */
	wipe(...rules: Rule[]) {
		function explore(explored: Ast) {
			if (!explored.children)
				return;
			for (let i = explored.children.length - 1; i >= 0; i--) {
				let child = explored.children[i];
				let shouldRemove = rules.some(rule =>
					(child.name && child.name == rule.name) || (child.literal && child.literal == rule.literal)
				);
				if (shouldRemove) {
					explored.children.splice(i, 1);
					// Clear parent reference
					child.parent = undefined;
				} else {
					explore(child);
				}
			}
		}
		explore(this);
		return this;
	}

	/**
	 * simplify unwanted rules but maintain their children.
	 */
	simplify(...rules: Rule[]) {
		function explore(explored: Ast) {
			if (!explored.children)
				return;

			// First explore children
			for (let i = explored.children.length - 1; i >= 0; i--) {
				explore(explored.children[i]);
			}

			// Then check if this node should be simplified
			let shouldSimplify = rules.some(rule =>
				explored.name && explored.name == rule.name
			);

			if (shouldSimplify && explored.parent && explored.parent.children) {
				let index = explored.parent.children.findIndex(c => c === explored);
				if (index !== -1) {
					// Update parent references for children
					explored.children.forEach(child => {
						child.parent = explored.parent;
					});
					// Replace this node with its children
					explored.parent.children.splice(index, 1, ...explored.children);
				}
			}
		}
		explore(this);
		return this;
	}

	/**
	 * collapse wrapper rules to their text. a literal Ast node is added.
	 */
	collapse(...rules: Rule[]) {
		function explore(explored: Ast) {
			if (!explored.children)
				return;

			// First explore children
			for (let i = explored.children.length - 1; i >= 0; i--) {
				explore(explored.children[i]);
			}

			// Then check if this node should be collapsed
			let shouldCollapse = rules.some(rule =>
				explored.name && explored.name == rule.name
			);

			if (shouldCollapse && explored.parent && explored.parent.children) {
				let index = explored.parent.children.findIndex(c => c === explored);
				if (index !== -1) {
					let added = new Ast(explored.name, explored.getText());
					added.evaluableType = explored.evaluableType;
					added.parent = explored.parent;
					explored.parent.children.splice(index, 1, added);
				}
			}
		}
		explore(this);
		return this;
	}


	flatten(): Ast[] {
		let result: Ast[] = [];

		function explore(explored: Ast) {
			if (explored.literal)
				result.push(explored)
			for (let child of explored.children || [])
				explore(child);
		}

		explore(this);

		return result;
	}

	findFirst(rule: Rule): Ast | null {
		if (this.name === rule.name) return this;
		for (const child of this.children || []) {
			const found = child.findFirst(rule);
			if (found) return found;
		}
		return null;
	}

	findLast(rule: Rule): Ast | null {
		if (this.name === rule.name) return this;
		if (!this.children)
			return null;
		for (let i = this.children.length - 1; i >= 0; i--) {
			let child = this.children[i];
			const found = child.findFirst(rule);
			if (found) return found;
		}
		return null;
	}

	findAll(rule: Rule): Ast[] {
		const results: Ast[] = [];
		if (this.name === rule.name) results.push(this);
		for (const child of this.children || []) {
			results.push(...child.findAll(rule));
		}
		return results;
	}

	getText(pretty: boolean = false): string {
		if (this.literal)
			return this.literal;
		if (!this.children)
			throw new Error("undefined literal and undefined children")

		if (pretty) {
			if (this.children.length == 1)
				return this.children.map(c => c.getText(true)).join(" ");
			return "(" + this.children.map(c => c.getText(true)).join(" ") + ")";
		}

		return this.children.map(c => c.getText()).join("");
	}
}
