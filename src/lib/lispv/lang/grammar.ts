import { Rule, RuleMethod } from "../parser/rule";

import { EExpression } from "./expressions/expression";
import { ENumber } from "./expressions/number";
import { EVariable } from "./expressions/variable";
import { EApplication } from "./expressions/application";

import { EPlus } from "./expressions/operations/plus";
import { EMinus } from "./expressions/operations/minus";
import { EIf } from "./expressions/operations/if";
import { EDefun } from "./expressions/operations/defun";
import { EFunction } from "./expressions/operations/function";
import { EArgs } from "./expressions/operations/args";
import { EAnd} from "./expressions/operations/predicates/and"
import { ENot } from "./expressions/operations/predicates/not";
import { EOr } from "./expressions/operations/predicates/or";
import { EGreater } from "./expressions/operations/predicates/greater";
import { ELess } from "./expressions/operations/predicates/less";
import { EEq } from "./expressions/operations/predicates/eq";

// we define here a CFG (Context Free Grammar) for our language. it is a Chomsky-level-2 language.

// white spaces
export const SPACE = Rule.literal(" ");
export const ZERO_OR_MORE_SPACES = Rule.zeroOrMore("optional_spaces", SPACE);
export const ONE_OR_MORE_SPACES = Rule.oneOrMore("spaces", SPACE);

// digits
export const DIGIT = Rule.or(
	"digit",
	..."1234567890".split("").map((x) => Rule.literal(x)),
);
export const NUMBER = Rule.oneOrMore("number", DIGIT).addEvaluable(ENumber);

// brackets
export const LBRACKET = Rule.literal("(");
export const RBRACKET = Rule.literal(")");

// primitive operations
export const PLUS = Rule.literal("+").addEvaluable(EPlus);

export const MINUS = Rule.literal("-").addEvaluable(EMinus);

export const IF = Rule.literal("if").addEvaluable(EIf);

export const DEFUN = Rule.literal("defun").addEvaluable(EDefun);

export const ARGS = Rule.literal("args").addEvaluable(EArgs);

// predicates
export const LESS = Rule.literal("less").addEvaluable(ELess);

export const GREATER = Rule.literal("greater").addEvaluable(EGreater);

export const EQ = Rule.literal("eq").addEvaluable(EEq);

export const NOT = Rule.literal("not").addEvaluable(ENot);

export const OR = Rule.literal("or").addEvaluable(EOr);

export const AND = Rule.literal("and").addEvaluable(EAnd);

// custom one-words
export const LETTER = Rule.or("letter", ..."abcdefghijklmnopqrstuvwxyz".split("").map((x) => Rule.literal(x)));

export const FUNCTION = Rule.oneOrMore("function", LETTER).addEvaluable(EFunction);

// definition of the allowed operations
export const OPERATION = Rule.or("operation");

// we need to be careful to have FUNCTION being the last rule that gets checked, cause it can have arbitrary characters. Also DEFUN must come before DEF because it would be ignored otherwise.
OPERATION.define([
	AND,
	ARGS,
	DEFUN,
	EQ,
	GREATER,
	IF,
	LESS,
	MINUS,
	NOT,
	OR,
	PLUS,
	FUNCTION
]);

// apart from custom operations we need to parse variable names, so we give it a different rule, for different positions in the grammar and a different role in the phase of evaluation.
export const VARIABLE = Rule.oneOrMore("variable", LETTER).addEvaluable(EVariable);

// expressions are of different kinds, and recursively defined
export const EXPRESSION = new Rule();
EXPRESSION.name = "expression";
EXPRESSION.addEvaluable(EExpression);

// expressions can themselves be numbers or variables
export const NUMBER_OR_VARIABLE_OR_EXPRESSION = Rule.or("", NUMBER, VARIABLE, EXPRESSION)

// expressions can be surrounded by optional spaces
export const EXPRESSION_AND_OPTIONAL_SPACES = Rule.and("", ZERO_OR_MORE_SPACES, NUMBER_OR_VARIABLE_OR_EXPRESSION, ZERO_OR_MORE_SPACES);

export const ZERO_OR_MORE_EXPRESSIONS = Rule.zeroOrMore("", EXPRESSION_AND_OPTIONAL_SPACES);

export const APPLICATION = Rule.and("application",
	OPERATION,
	ONE_OR_MORE_SPACES,
	ZERO_OR_MORE_EXPRESSIONS,
).addEvaluable(EApplication);

export const APPLICATION_OR_VARIABLE_OR_NUMBER_OR_EXPRESSION = Rule.or("application_or_variable_or_number");
APPLICATION_OR_VARIABLE_OR_NUMBER_OR_EXPRESSION.define([
	APPLICATION,
	VARIABLE,
	NUMBER,
	EXPRESSION
])

// ultimately, the expression is defined as a parenthesized application of one operation to zero or more expressions
EXPRESSION.method = RuleMethod.And;
EXPRESSION.define([
	LBRACKET,
	ZERO_OR_MORE_SPACES,
	APPLICATION_OR_VARIABLE_OR_NUMBER_OR_EXPRESSION,
	ZERO_OR_MORE_SPACES,
	RBRACKET,
]);

// the grammar consists of just an expression. it is in the time of the traversal of the ast that we decide if the operations have been applied with care
export const GRAMMAR = Rule.or("grammar");
GRAMMAR.define([NUMBER_OR_VARIABLE_OR_EXPRESSION]);
