var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var program;
var iBuffer;
var vPosition;
var vBuffer;

// vertices is the actual list of vertices
var vertices = [];
// colors is the actual list of colors
var colors = [];

// indices defines the list of this lists of indeces which define each polygon
var indices = [];
// colorIndeces defines the color index for each polygon
var colorIndeces = [];

var theta = [];

var cubeSize = 10;
var cubeSize2 = cubeSize / 2.0;

var depthMin = 0.1;
var depthMax = 10 * cubeSize;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var aspect;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

	/** @type {WebGLRenderingContext} */
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colors = [
		vec4(1.0, 0.0, 0.0, 1.0),  // red
		vec4(1.0, 1.0, 0.0, 1.0),  // yellow
		vec4(0.0, 1.0, 0.0, 1.0),  // green
		vec4(0.0, 0.0, 1.0, 1.0),  // blue
		vec4(0.0, 1.0, 1.0, 1.0),   // cyan
		vec4(1.0, 0.0, 1.0, 1.0),  // magenta
	];


    // LOAD GAME RENDERED OBJECTS



    // TODO: replace these calls which hard set the values with game logic which places objects here
    // vertices is the actual list of vertices
    vertices = [
		vec4(0, 0, cubeSize, 1),
		vec4(0, cubeSize, cubeSize, 1),
		vec4(cubeSize, cubeSize, cubeSize, 1),
		vec4(cubeSize, 0.0, cubeSize, 1),
		vec4(0, 0, 0, 1),
		vec4(0, cubeSize, 0, 1),
		vec4(cubeSize, cubeSize, 0, 1),
		vec4(cubeSize, 0, 0, 1)
	];

    // indices defines the list of this lists of indeces which define each polygon
	indices = [
		[1, 0, 3, 3, 2, 1],  // front face
		[2, 3, 7, 6],  // right face
		[3, 0, 4, 4, 7],  // bottom face
		[6, 5, 1, 1, 2, 6],  // top face
		[4, 5, 6, 6, 7, 4],  // back face
		[5, 4, 0, 0, 1, 5]   // left face
	];

    // colorIndeces defines the color index for each polygon
    colorIndeces = [0, 1, 2, 3, 4, 5] // GAME.getColorInd();




    // world rotation
	theta[0] = 0.0;
	theta[1] = 0.0;
	theta[2] = 0.0;

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
	aspect = canvas.width / canvas.height;
    gl.clearColor(1, 1, 1, 1);
	gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

	colorLoc = gl.getUniformLocation(program, "color");
	modelViewLoc = gl.getUniformLocation(program, "modelView");
	projectionLoc = gl.getUniformLocation(program, "projection");

    vBuffer = gl.createBuffer();
    vPosition = gl.getAttribLocation(program, "vPosition");
	iBuffer = gl.createBuffer();

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
                                                         // this is cool trick to excape the nested arrays
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([].concat.apply([], indices)), gl.STATIC_DRAW);


    var c = [];
    var s = [];
	for (i = 0; i < 3; i++) {
		var a = radians(theta[i]);
		c[i] = Math.cos(a);
		s[i] = Math.sin(a);
	}

	var rx = mat4(1.0, 0.0, 0.0, 0.0,
			      0.0, c[0], -s[0], 0.0,
				  0.0, s[0], c[0], 0.0,
				  0.0, 0.0, 0.0, 1.0);

	var ry = mat4(c[1], 0.0, s[1], 0.0,
				  0.0, 1.0, 0.0, 0.0,
				  -s[1], 0.0, c[1], 0.0,
				  0.0, 0.0, 0.0, 1.0);

	var rz = mat4(c[2], -s[2], 0.0, 0.0,
				  s[2], c[2], 0.0, 0.0,
				  0.0, 0.0, 1.0, 0.0,
				  0.0, 0.0, 0.0, 1.0);

	var tz1 = mat4(1.0, 0.0, 0.0, -cubeSize2,
				   0.0, 1.0, 0.0, -cubeSize2,
				   0.0, 0.0, 1.0, -cubeSize2,
				   0.0, 0.0, 0.0, 1.0);

	var tz2 = mat4(1.0, 0.0, 0.0, cubeSize2,
				   0.0, 1.0, 0.0, cubeSize2,
				   0.0, 0.0, 1.0, cubeSize2,
				   0.0, 0.0, 0.0, 1.0);

	var looking = lookAt(vec3(cubeSize2, cubeSize2, 4 * cubeSize), vec3(cubeSize2, cubeSize2, 0), vec3(0, 1, 0));
	var rotation = mult(rz, mult(ry, rx));
	var modelView = mult(looking, mult(tz2, mult(rotation, tz1)));
	var projection = perspective(50, aspect, depthMin, depthMax);

	gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

    var index = 0;
	for (var i = 0; i < indices.length; i++) {
		gl.uniform4fv(colorLoc, colors[colorIndeces[i]]);
		gl.drawElements(gl.TRIANGLE_FAN, indices[i].length, gl.UNSIGNED_BYTE, index);
        index += indices[i].length;
	}

	requestAnimFrame(render);
};
