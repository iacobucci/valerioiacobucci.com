class Trace {
	constructor(maxlines) {
		this.maxlines = maxlines;
		this.points = [];
	}
	push(pos) {
		this.points.push(pos);

		if (this.points.length > this.maxlines) this.points.shift();
	}
	show() {
		strokeWeight(1);
		for (let i = 0; i < this.points.length - 2; i++) {
			stroke((255 * i) / this.points.length);
			line(
				this.points[i][0],
				this.points[i][1],
				this.points[i + 1][0],
				this.points[i + 1][1]
			);
		}
	}
}
