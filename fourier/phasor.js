class Phasor {
	constructor(c,omega) {
		this.c = c;
		this.omega = omega;
	}

	tip(t) {
		return math.multiply(this.c, math.exp(math.multiply(this.omega * math.pi * t, math.i)));
	}

	show(base,t) {
		line(base.re, base.im, base.re + this.tip(t).re, base.im + this.tip(t).im);
	}
}
