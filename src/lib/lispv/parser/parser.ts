import { Rule, RuleMethod } from "./rule";
import { Parsed } from "./parsed";
import { DEBUG, DEBUG_PARSER } from "../flags";

const debug = DEBUG_PARSER || DEBUG;

export interface ParseError {
	position: number;
}

export interface RecursiveParseResult {
	matched: boolean;
	remaining: string;
}

export interface ParseResult {
	matched: boolean;
	parsed?: Parsed;
	error?: ParseError;
}

export class Parser {
	rule: Rule;
	private parsed: Parsed;
	debug: boolean = debug;

	constructor(rule: Rule) {
		this.rule = rule;
		let mainName: string = "";

		if (this.rule.literal)
			mainName = this.rule.literal;
		if (this.rule.name)
			mainName = this.rule.name

		this.parsed = new Parsed(mainName, 0);
	}

	parse(text: string): ParseResult {
		let inputLength = text.length;

		debug && console.log("parsing", text);

		const recursiveResult = this.parseRecursive(this.rule, text, this.parsed);
		const fullyParsed = recursiveResult.matched && recursiveResult.remaining === "";

		let result: ParseResult = {
			matched: fullyParsed,
		}

		if (!result.matched) {
			result.error = {
				position: (inputLength - recursiveResult.remaining.length)
			}
		} else {
			result.parsed = this.parsed;
		}

		return result;
	}

	private parseRecursive(rule: Rule, text: string, parent: Parsed, depth = 0): RecursiveParseResult {
		// non-empty rule.literal string means we're dealing with a literal
		if (rule.literal) {
			let child = new Parsed(rule.literal, depth, rule.literal);
			child.evaluableType = rule.evaluableType;

			let matched = rule.match(text)

			if (matched.matched && parent.children) {
				parent.children.push(child);
				this.debug && rule.debug(depth);
			}

			return matched;
		}

		if (rule.method === RuleMethod.Or) {
			let child = parent;

			if (rule.name) {
				child = new Parsed(rule.name, depth);
				child.evaluableType = rule.evaluableType;
			}

			for (const subrule of rule.definition) {
				const result = this.parseRecursive(subrule, text, child, depth + 1);

				if (result.matched) {
					if (rule.name && parent.children)
						parent.children.push(child);

					this.debug && rule.debug(depth);

					return result;
				}
			}

			return { matched: false, remaining: text };
		}

		if (rule.method === RuleMethod.And) {
			let currentText = text;
			let child = parent;

			if (rule.name) {
				child = new Parsed(rule.name, depth);
				child.evaluableType = rule.evaluableType;
			}

			for (const subrule of rule.definition) {
				const result = this.parseRecursive(subrule, currentText, child, depth + 1);

				if (!result.matched) {
					return { matched: false, remaining: text };
				}

				currentText = result.remaining;
			}

			if (rule.name && parent.children)
				parent.children.push(child);

			this.debug && rule.debug(depth);

			return { matched: true, remaining: currentText };
		}

		if (rule.method === RuleMethod.ZeroOrMore) {
			let currentText = text;
			let child = parent;

			if (rule.name) {
				child = new Parsed(rule.name, depth);
				child.evaluableType = rule.evaluableType;
			}

			while (true) {
				let allMatched = true;
				let tempText = currentText;

				for (const subrule of rule.definition) {
					const result = this.parseRecursive(subrule, tempText, child, depth + 1);

					if (!result.matched) {
						allMatched = false;
						break;
					}

					tempText = result.remaining;
				}

				if (!allMatched || tempText === currentText) {
					break;
				}

				currentText = tempText;
			}

			if (rule.name && parent.children)
				parent.children.push(child);

			this.debug && rule.debug(depth);

			return { matched: true, remaining: currentText };
		}

		// default

		return { matched: false, remaining: text };
	}
}
