var f;
var sc = 1;
var pause = false;
var mx,my;
var input;
var file;
var t;
var t_delta = 0;
var t_mult = 5;

function startup(definition,maxtrace){
	f = new Fourier(definition,maxtrace);

	f.ps[0].c = math.complex(0,0);
	for (let p in f.ps)
		f.ps[p].c = math.multiply(f.ps[p].c,10);
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(60);
	background(0);
	stroke(255);
	input = createFileInput(handleFile);
	input.position(10,10);
	input.id("inputfile");

	startup(100,400);

	mx = width/2;
	my = height/2;
}

function draw() {
	createCanvas(windowWidth, windowHeight);
	background(0);
	translate(mx,my); 
    scale(sc, sc);

	if (!pause)
		t_delta += 1; 

	t = t_delta/(60*t_mult);
	
	f.show(t);
	f.trace(t);
}

function handleFile(f) {
	file = f.data.split("base64,")[1];
	raw = atob(file);
	data = raw.split(" d=\"")[1];
	newpath = data.substring(data.indexOf("m"),data.indexOf('\"'));
	path.setAttribute("d",newpath);
	startup(100,400);
}

function mouseWheel(event) {
	if (event.delta > 0)
		sc = sc / 1.1;
	else if (sc < 10)
		sc = sc * 1.1;

	if (sc < 1){
		mx = width/2;
		my = height/2;
		sc = 1;
	}
}

function mouseDragged(event) {
	mx += event.movementX;
	my += event.movementY;
}

function keyPressed(){
	console.log(key);
	if (key == " ")
		pause = !pause;
}
