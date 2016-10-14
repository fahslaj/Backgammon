/** @namespace gl.DEPTH_TEST */
/** @namespace gl.ARRAY_BUFFER */
/** @namespace gl.STATIC_DRAW */

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
var maxNumVertices = 10000;
var worldIndicesOffset;

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

const boardscale = scale * 1.5;
const boardLength = boardscale * 2 / 3;
const boardWidth = boardscale / 2;
const boardHeight = boardscale / 6;
const boardwallwidth = boardscale / 16;

var playableLength = boardLength - 2*boardwallwidth;
var playableWidth = boardWidth - 2*boardwallwidth;
var barWidth = 2*boardwallwidth;

var triangleWidth = (playableLength - barWidth) / 12;
var pieceRadius = triangleWidth / 2;

var pieceNumPoints = 20;
var triangleRef =   [
                        []
                    ];



var boardOffset = -boardscale / 2;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    /** @type {WebGLRenderingContext} */
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // load base colors
    colors.push(
        rgb(210, 180, 140), // brown
        rgb(210, 170, 116),
        rgb(91, 81, 80), // charcoal
        rgb(68, 61, 60), // charcoal
        rgb(168, 77, 70),
        rgb(26, 27, 28)
    );

    // world rotation
    theta[0] = 0.0;
    theta[1] = 0.0;
    theta[2] = 0.0;
    // theta[0] += 50; theta[1] += 50; theta[2] += 50;

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
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    initBoard();
    worldIndicesOffset = indices.length;

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

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    console.log(vertexOffset);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * vertexOffset, flatten(newVertices));

    colorIndices = colorIndices.concat(newColorIndices);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

    var eye = vec3(0, scale * 2, scale);

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

function updatePlayable() {
    GameState.board.triangles.forEach(function (element, index, array) {

    })
}

function initBoard() {
    // board
    var walltop = boardOffset + boardHeight / 2;
    addObject(
        [
            // base
            vec4(-boardLength, boardOffset - boardHeight, -boardWidth, 1), // 0
            vec4(boardLength, boardOffset - boardHeight, -boardWidth, 1),
            vec4(boardLength, boardOffset - boardHeight, boardWidth, 1),
            vec4(-boardLength, boardOffset - boardHeight, boardWidth, 1),

            // board level
            vec4(-boardLength, boardOffset, -boardWidth, 1), // 4
            vec4(boardLength, boardOffset, -boardWidth, 1),
            vec4(boardLength, boardOffset, boardWidth, 1),
            vec4(-boardLength, boardOffset, boardWidth, 1),

            // walls
            vec4(-boardLength, walltop, -boardWidth, 1), // 8
            vec4(boardLength, walltop, -boardWidth, 1),
            vec4(boardLength, walltop, boardWidth, 1),
            vec4(-boardLength, walltop, boardWidth, 1),

            vec4(-boardLength + boardwallwidth, walltop, -boardWidth + boardwallwidth, 1), // 12
            vec4(boardLength - boardwallwidth, walltop, -boardWidth + boardwallwidth, 1),
            vec4(boardLength - boardwallwidth, walltop, boardWidth - boardwallwidth, 1),
            vec4(-boardLength + boardwallwidth, walltop, boardWidth - boardwallwidth, 1),

            vec4(-boardLength + boardwallwidth, boardOffset, -boardWidth + boardwallwidth, 1), // 16
            vec4(boardLength - boardwallwidth, boardOffset, -boardWidth + boardwallwidth, 1),
            vec4(boardLength - boardwallwidth, boardOffset, boardWidth - boardwallwidth, 1),
            vec4(-boardLength + boardwallwidth, boardOffset, boardWidth - boardwallwidth, 1),

            // bar
            vec4(0 + boardwallwidth, walltop, -boardWidth + boardwallwidth, 1), // 20
            vec4(0 - boardwallwidth, walltop, -boardWidth + boardwallwidth, 1),
            vec4(0 + boardwallwidth, walltop, boardWidth - boardwallwidth, 1),
            vec4(0 - boardwallwidth, walltop, boardWidth - boardwallwidth, 1),

            vec4(0 + boardwallwidth, boardOffset, -boardWidth + boardwallwidth, 1), // 24
            vec4(0 - boardwallwidth, boardOffset, -boardWidth + boardwallwidth, 1),
            vec4(0 + boardwallwidth, boardOffset, boardWidth - boardwallwidth, 1),
            vec4(0 - boardwallwidth, boardOffset, boardWidth - boardwallwidth, 1),
        ],
        [
            [0, 1, 2, 3],
            [4, 5, 6, 7],

            [0, 8, 11, 3],
            [0, 8, 9, 1],
            [3, 11, 10, 2],
            [2, 10, 9, 1],

            [8, 12, 15, 11],
            [8, 12, 13, 9],
            [11, 15, 14, 10],
            [10, 14, 13, 9],

            [12, 16, 19, 15],
            [12, 16, 17, 13],
            [15, 19, 18, 14],
            [14, 18, 17, 13],

            [20, 21, 23, 22],
            [20, 22, 26, 24]
        ],
        [2, 1, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, 2, 3, 3]
    );

    GameState.board.triangles.forEach(function (element, index, array) {

    })

}

function rgb(r, g, b) {
    return vec4(r / 255, g / 255, b / 255, 1);
}

function spinboard() {
    var degreesRemaining = GameState.turn ? -180 : 180;
    rotateRemaining(degreesRemaining);
}

// var degreesRemaining = 0;

function rotateRemaining(degreesRemaining) {
    if (degreesRemaining == 0) {
        return;
    } else if (degreesRemaining > 0) {
        theta[1] += 1;
        setTimeout(function() {return rotateRemaining(degreesRemaining - 1)}, 3);
    } else {
        theta[1] -= 1;
        setTimeout(function() {return rotateRemaining(degreesRemaining + 1)}, 3);
    }
}
