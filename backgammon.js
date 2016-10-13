/** @namespace gl.DEPTH_TEST */
/** @namespace gl.ARRAY_BUFFER */

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

// indices defines the list of this lists of indices which define each polygon
var indices = [];
// colorIndices defines the color index for each polygon
var colorIndices = [];

var theta = [];

var scale = 1;

var zoom = 0;

var depthMin = 0.1;
var depthMax = 10 * scale;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var aspect;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);


const boardLength = scale * 2 / 3;
const boardWidth = scale * 1 / 2;
const boardHeight = scale *  1 / 6;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    /** @type {WebGLRenderingContext} */
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // load base colors
    colors.push(
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(210 / 255, 180 / 255, 140 / 255) // brown
    );

    // world rotation
    theta[0] = 0.0;
    theta[1] = 0.0;
    theta[2] = 0.0;
    // theta[0] += 50; theta[1] += 50; theta[2] += 50;

    initBoard();

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

/**
 * Adds a new object made of polygons to be rendered.
 *
 * Given indices are relative to the new vertices, but colors are relative to the global color list
 */
function addObject(newVertices, newIndices, newColorIndices) {
    var vertexOffset = vertices.length;
    vertices = vertices.concat(newVertices);
    indices = indices.concat(newIndices.map(function(indexList) {
        return indexList.map(function(elem) {
            return elem + vertexOffset;
        });
    }));
    colorIndices = colorIndices.concat(newColorIndices);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([].concat.apply([], indices)), gl.STATIC_DRAW);

    var c = [];
    var s = [];
    for (var i = 0; i < 3; i++) {
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

    // rotate the world based on the turn
    var eye = vec3(0, scale * 2, GameState.turn ? -scale : scale);

    var looking = lookAt(eye, at, up);
    var rotation = mult(rz, mult(ry, rx));
    var modelView = mult(looking, rotation);
    var projection = perspective(50, aspect, depthMin, depthMax);

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

    drawWorld();

    // TODO: draw points

    requestAnimFrame(render);
}

function drawWorld() {
    var index = 0;
    while (colorIndices.length < indices.length) {
        console.log("not all polygons have colors! setting them to something");
        colorIndices.push(0)
    }

    for (var i = 0; i < indices.length; i++) {
        gl.uniform4fv(colorLoc, colors[colorIndices[i]]);
        gl.drawElements(gl.TRIANGLE_FAN, indices[i].length, gl.UNSIGNED_BYTE, index);
        index += indices[i].length;
    }
}

function updatePiecesPoints() {
    GameState.board.triangles.forEach(function (element, index, array) {

    })
}

function initBoard() {
    // addObject(
    //     [
    //         vec4(0, 0, scale / 5, 1),
    //         vec4(0, scale / 5, scale / 5, 1),
    //         vec4(scale / 5, scale / 5, scale / 5, 1),
    //         vec4(scale / 5, 0.0, scale / 5, 1),
    //         vec4(0, 0, 0, 1),
    //         vec4(0, scale / 5, 0, 1),
    //         vec4(scale / 5, scale / 5, 0, 1),
    //         vec4(scale / 5, 0, 0, 1)
    //     ],
    //     [
    //         [1, 0, 3, 3, 2, 1],  // front face
    //         [2, 3, 7, 6],  		 // right face
    //         [3, 0, 4, 4, 7],  	 // bottom face
    //         [6, 5, 1, 1, 2, 6],  // top face
    //         [4, 5, 6, 6, 7, 4],  // back face
    //         [5, 4, 0, 0, 1, 5]   // left face
    //     ],
    //     [
    //         0, 1, 2, 3, 4, 5
    //     ]);

    addObject(
        [
            vec4(-boardLength, 0, -boardWidth, 1),
            vec4(boardLength, 0, -boardWidth, 1),
            vec4(boardLength, 0, boardWidth, 1),
            vec4(-boardLength, 0, boardWidth, 1),
            // vec4(-.5, .5, .5, 1)
        ],
        [
            [0, 1, 2, 3],
            // [0, 1, 3]
        ],
        [
            6,
            6
        ]
    );

}
