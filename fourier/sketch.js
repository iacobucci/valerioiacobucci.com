var f;
var sc = 1;
var mx,my;
var input;
var file;

function startup(){
	f = new Fourier(100,400);

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

	startup();

	mx = width/2;
	my = height/2;
}

function draw() {
	createCanvas(windowWidth, windowHeight);
	background(0);
	translate(mx,my); 
    scale(1 * sc, 1 * sc);
	
	f.show(t());
	f.trace(t());
}

function handleFile(f) {
	// console.log(f.data);
	
	file = f.data.split("base64,")[1];
	raw = atob(file);
	data = raw.split(" d=\"")[1];
	newpath = data.substring(data.indexOf("m"),data.indexOf('\"'));
	path.setAttribute("d",newpath);
	startup();
}

function t(){
	let mult = 5;
	return frameCount/(60*mult);
}

function mouseWheel(event) {
	if (event.delta > 0)
		sc = sc / 1.1;
	else if (sc < 8)
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

