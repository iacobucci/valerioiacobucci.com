var path;
class Converter{

	constructor(n){
		path = document.querySelector("path");
		let len = path.getTotalLength();

		this.points = [];
		this.n = n;
		for (let i = 0; i < n ; i++)
			this.points.push(path.getPointAtLength(i/n * len));
	}

	get(index){
		let coefficent = math.complex(0,0);
		for (let i = 0; i < this.n ; i++){
			let f = math.complex(this.points[i].x,this.points[i].y);
			let m = math.multiply(-1, index, 2, math.pi, math.i, i/this.n);
			let e = math.exp(m);
			let a = math.multiply(f, e, 1/this.n)
			coefficent = math.add(coefficent, a);
		}
		return coefficent;
	}

}
