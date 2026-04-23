import { Evaluable } from "./evaluable";

export enum AnswerType {
	NUMBER,
	NULL,
};

export class Answer extends Evaluable {
	type: AnswerType = AnswerType.NUMBER;
	value: number = 0;
}