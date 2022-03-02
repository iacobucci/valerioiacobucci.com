class Fourier {
	constructor(definition,maxtrace) {
		this.ps = [];
		this.tr = new Trace(maxtrace);
		this.converter = new Converter(definition);

		let sign = +1;
		let index;

		for (let i = 0; i < definition; i++) {
			index = sign * math.ceil(i/2);
			this.ps.push( new Phasor( this.converter.get(index), index));
			sign = -1 * sign;
		}
	}

	repr(){
		let eq = "f(t)=";

		for (let p in this.ps){
			eq += "(" + this.ps[p].c.re.toFixed(2) + "+" + this.ps[p].c.im.toFixed(2) + "i)*e^(" + this.ps[p].omega + "*2πit) + ";
		}
		return eq;
	}

	show(t) {
		let base = this.ps[0].c;
		strokeWeight(0.5);
		for (let i = 1; i < this.ps.length; i++) {
			colorMode(HSB);
			stroke(i % 8 * 255 / 8, 60, 80);
			this.ps[i].show(base,t);
			base = math.add(base,this.ps[i].tip(t));
		}
	}

	trace(t) {
		let last = this.ps[0].c;
		for (let i = 1; i < this.ps.length; i++) {
			last = math.add(last,this.ps[i].tip(t));
		}
		this.tr.push([last.re,last.im]);
		this.tr.show();
	}
}
