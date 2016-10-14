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
var maxNumVertices = 100000;
var worldIndexOffset;

var theta = [];

var scale = 1;

var zoom = 0;

var flatset = .005;
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
const boardWidth = boardscale / 2 + .1;
const boardHeight = boardscale / 6;
const boardwallwidth = boardscale / 16;

var playableLength = boardLength - boardwallwidth;
var playableWidth = boardWidth - boardwallwidth;
var barWidth = 2*boardwallwidth;

var triangleWidth = (playableLength - barWidth / 2) / 6;
var pieceRadius = triangleWidth / 2;

var pieceNumPoints = 20;
var triangleRef =   [];

var boardOffset = -boardscale / 2;

var clipAreas2d = [
    [vec2(.6, .2225), vec2(.5125, -0.175)],
    [vec2(0.5125, 0.2225), vec2(0.4225, -0.1825)],
    [vec2(.4225, 0.2225), vec2(0.365, -0.185)],
    [vec2(0.3325, 0.2225), vec2(0.2675, -0.1875)],
    [vec2(0.2425, 0.2225), vec2(0.167, -0.1825)],
    [vec2(0.155, 0.2225), vec2(0.0725, -0.175)],

    [vec2(-0.0625, 0.2225), vec2(-0.1575, -0.18)],
    [vec2(-0.1525, 0.2225), vec2(-0.2625, -0.185)],
    [vec2(-0.2375, 0.225), vec2(-0.3625, -0.185)],
    [vec2(-0.325, 0.2225), vec2(-0.45, -0.18)],
    [vec2(-0.43, 0.225), vec2(-0.5525, -0.18)],
    [vec2(-0.5575, 0.2225), vec2(-0.6575, -0.175)],

    [vec2(-0.590, -0.3125), vec2(-0.755, -0.8375)],
    [vec2(-0.475, -0.3025), vec2(-0.645, -0.8375)],
    [vec2(-0.3775, -0.3125), vec2(-0.5275, -0.8425)],
    [vec2(-0.275, -0.315), vec2(-0.4175, -0.8375)],
    [vec2(-0.170, -0.314), vec2(-0.305, -0.84)],
    [vec2(-0.0725, -0.3175), vec2(-0.19, -0.835)],

    [vec2(0.17, -0.3075), vec2(0.0825, -0.835)],
    [vec2(0.2775, -0.3125), vec2(0.195, -0.8375)],
    [vec2(0.375, -0.31), vec2(0.305, -0.8375)],
    [vec2(0.48, -0.305), vec2(0.4175, -0.8325)],
    [vec2(0.5875, -0.3075), vec2(0.5325, -0.8375)],
    [vec2(0.6875, -0.32), vec2(0.6425, -0.8275)],

    // BAR
    [vec2(0.06, 0.2675), vec2(-0.08, -0.835)]
];
// var clipAreas3d = [];

var modelView;
var projection;

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
        rgb(50, 50, 152), // dark blue
        rgb(25, 25, 75), // blue-black
        rgb(179, 0, 0), // dark red
        rgb(255, 255, 204), // off-white
        vec4(0, 0, 0, 25 / 255), // charcoal w/ alpha
        vec4(0, 0, 0, 0) // clear
    );

    // world rotation
    theta[0] = 0.0;
    theta[1] = 0.0;
    theta[2] = 0.0;
    // theta[0] += 50; theta[1] += 50; theta[2] += 50;

    canvas.addEventListener("mousedown", function (event) {
        var point = getCanvasPoint(event);
        var x;
        for (var i = 0; i < clipAreas2d.length; i++) {
            x = clipAreas2d[i];
            if ( x[0][0] > point[0] && x[1][0] < point[0] && x[0][1] > point[1] && x[1][1] < point[1] ||
                    x[0][0] < point[0] && x[1][0] > point[0] && x[0][1] < point[1] && x[1][1] > point[1] ) {
                console.log(i);

            }
        }
    });


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
    worldIndexOffset = vertices.length;
    initPieces();

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
    indices = concatAndOffset(indices, newIndices, vertexOffset);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * vertexOffset, flatten(newVertices));

    colorIndices = colorIndices.concat(newColorIndices);
}

function concatAndOffset(a1, a2, offset) {
    return a1.concat(a2.map(function(i) {
        return i.map(function(elem) {
            return elem + offset;
        });
    }));
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
    modelView = mult(looking, rotation);
    projection = perspective(50, aspect, depthMin, depthMax);

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

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

    requestAnimFrame(render);
}

function updateClickAreas() {
    /**
     *  I couldn't get my 3d to 2d point conversion working because the scaling isn't from -1 to 1 and various other issues
     *
     *   :(
     *
     */

    var temp;
    for (var i = 0; i < 12; i++) {
        temp = clipAreas2d[i];
        clipAreas2d[i] = clipAreas2d[12 + i];
        clipAreas2d[12 + i] = temp;
    }

    // var viewProj = mult(projection, modelView);
    // compute 3d triangle areas
    // for (var i = 0; i < triangleRef.length; i++) {
    //     clipAreas3d[i] = [];
    //     clipAreas3d[i].push(triangleRef[i][0]);
    //     var point2 = vec4(  triangleRef[i][0][0] - triangleWidth * triangleRef[i][1],
    //                         triangleRef[i][0][1],
    //                         triangleRef[i][0][2] + triangleWidth * 5 * triangleRef[i][1],
    //                         triangleRef[i][0][3] );
    //     clipAreas3d[i].push(point2);
    // }
    //
    // // TODO: compute special areas
    //
    //
    // // go through and compute clicks
    // for (i = 0; i < clipAreas3d.length; i++) {
    //     var point2d_1 = getCanvasPosition(clipAreas3d[i][0], viewProj);
    //     var point2d_2 = getCanvasPosition(clipAreas3d[i][1], viewProj);
    //     clipAreas2d[i] = [point2d_1, point2d_2];
    // }

    // if (!clipClolorOffset)
    //     clipClolorOffset = colors.length;

    // for (i = 0; i < clipAreas3d.length; i++) {
    //     addObject(
    //         [
    //             vec4( clipAreas3d[i][0][0], clipAreas3d[i][0][1] + boardHeight / 4 + flatset, clipAreas3d[i][0][2], clipAreas3d[i][0][3] ),
    //             vec4( clipAreas3d[i][0][0], clipAreas3d[i][0][1] + boardHeight / 4 + flatset, clipAreas3d[i][1][2], clipAreas3d[i][0][3] ),
    //             vec4( clipAreas3d[i][1][0], clipAreas3d[i][1][1] + boardHeight / 4 + flatset, clipAreas3d[i][1][2], clipAreas3d[i][1][3] ),
    //             vec4( clipAreas3d[i][1][0], clipAreas3d[i][1][1] + boardHeight / 4 + flatset, clipAreas3d[i][0][2], clipAreas3d[i][1][3] )
    //         ],
    //         [
    //             [0, 1, 2, 3]
    //         ],
    //         [ 9 ]
    //     )
    // }



}

function getCanvasPosition(point3d, viewProj) {
    // transform world to clipping coordinates
    var point3d_t = new vec4();
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++)
            point3d_t[i] += point3d[j] * viewProj[j][i];
    }

    for (i = 0; i < 4; i++)
        point3d_t[i] = point3d_t[i] / point3d_t[3];

    var point2d = vec2( point3d_t[0],
                        1 - point3d_t[2] );
    return point2d;
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
        [2, 1, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, 2, 3]
    );

    var mapping = [];
    for (var i = 0; i < 18; i+=3) {
    	mapping.push([i, i + 1, i + 2]);
    }
    var colors = [6, 7, 6, 7, 6, 7];

    // upper right quadrant
    var points = [];
    for (var i = 0; i < 6; i++) {
    	var refPoint = vec4(playableLength - i * triangleWidth, 
    						boardOffset + flatset, 
    						-playableWidth,
    						1);
    	triangleRef.push([refPoint, 1]);
    	points.push(refPoint,
    				vec4(playableLength - (i + 1) * triangleWidth + triangleWidth / 2,
    						boardOffset + flatset,
    						-playableWidth + 5 * triangleWidth,
    						1),
    				vec4(playableLength - (i + 1) * triangleWidth,
    						boardOffset + flatset,
    						-playableWidth,
    						1));
    }
    addObject(points, mapping, colors);

    // upper left quadrant
    points = [];
    for (var i = 6; i >= 1; i--) {
    	var refPoint = vec4(-playableLength + i * triangleWidth, 
    						boardOffset + flatset, 
    						-playableWidth, 
    						1);
    	triangleRef.push([refPoint, 1]);
    	points.push(refPoint,
    				vec4(-playableLength + (i - 1) * triangleWidth + triangleWidth / 2,
    						boardOffset + flatset,
    						-playableWidth + 5 * triangleWidth, 
    						1),
    				vec4(-playableLength + (i - 1) * triangleWidth,
    						boardOffset + flatset,
    						-playableWidth, 
    						1));
    }
    addObject(points, mapping, colors);

    // lower left quadrant
    points = [];
    for (var i = 0; i < 6; i++) {
    	var refPoint = vec4(-playableLength + i * triangleWidth, 
    						boardOffset + flatset, 
    						playableWidth, 
    						1);
    	triangleRef.push([refPoint, -1]);
    	points.push(refPoint,
    				vec4(-playableLength + (i + 1) * triangleWidth - triangleWidth / 2,
    						boardOffset + flatset,
    						playableWidth - 5 * triangleWidth, 
    						1),
    				vec4(-playableLength + (i + 1) * triangleWidth,
    						boardOffset + flatset,
    						playableWidth, 
    						1));
    }
    addObject(points, mapping, colors);

    // lower right quadrant
    points = [];
    for (var i = 6; i >= 1; i--) {
    	var refPoint = vec4(playableLength - i * triangleWidth, 
    						boardOffset + flatset, 
    						playableWidth,
    						1);
    	triangleRef.push([refPoint, -1]);
    	points.push(refPoint,
    				vec4(playableLength - (i - 1) * triangleWidth - triangleWidth / 2,
    						boardOffset + flatset,
    						playableWidth - 5 * triangleWidth,
    						1),
    				vec4(playableLength - (i - 1) * triangleWidth,
    						boardOffset + flatset,
    						playableWidth,
    						1));
    }
    addObject(points, mapping, colors);
}

function initPieces() {
	// var piece = new Piece(0, triangleRef[0], worldIndicesOffset);
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
        return updateClickAreas();
    } else if (degreesRemaining > 0) {
        theta[1] += 1;
        setTimeout(function() {return rotateRemaining(degreesRemaining - 1)}, 3);
    } else {
        theta[1] -= 1;
        setTimeout(function() {return rotateRemaining(degreesRemaining + 1)}, 3);
    }
}

function Piece(initialTriangle, trianglePos, bufferOffset) {
	this.bufferOffset = bufferOffset;
	this.triangle = initialTriangle;
	this.trianglePos = trianglePos;
	this.directionModifier = triangleRef[this.triangle][1];
	this.center = [ triangleRef[this.triangle][0][0] + triangleWidth / 2 * -this.directionModifier,
		            triangleRef[this.triangle][0][2] + triangleWidth / 2 * this.directionModifier + 
		            	triangleWidth * this.trianglePos * this.directionModifier];
	this.numRimPoints = pieceNumPoints / 2;

	this.updatePoints = function(dx, dy) {
        this.center[0] += dx;
        this.center[1] += dy;

	    var points = [];

	    var theta = radians(360) / this.numRimPoints;
	    var currAngle = 0;
	    for (var i = 0; i < this.numRimPoints; i++) {
	        points.push(vec4(   pieceRadius * Math.cos(currAngle) + this.center[0],
                                boardOffset + boardHeight / 4,
	                            pieceRadius * Math.sin(currAngle) + this.center[1],
	                            1));
	        currAngle += theta;
    	}

    	currAngle = 0;
        for (i = 0; i < this.numRimPoints; i++) {
	        points.push(vec4(   pieceRadius * Math.cos(currAngle) + this.center[0],
                                boardOffset,
	                            pieceRadius * Math.sin(currAngle) + this.center[1],
	                            1));
	        currAngle += theta;
    	}

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * bufferOffset, flatten(points));
        return points;
	};

   	var ind = [];
    ind[0] = [];
    for (var i = 0; i < this.numRimPoints; i++) {
        ind[0].push(i);
    }
   	ind[1] = [];
    for (i = 0; i < this.numRimPoints; i++) {
        ind[1].push(i + this.numRimPoints);
    }
    for (i = 0; i < this.numRimPoints; i++) {
        ind.push([  i,
            (i + 1) % this.numRimPoints,
            (i + 1) % this.numRimPoints + this.numRimPoints,
            i + this.numRimPoints])
    }

    indices = concatAndOffset(indices, ind, this.bufferOffset);
    colorIndices = colorIndices.concat([4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);

    this.updatePoints(0, 0);
}

function getCanvasPoint(mouseevent) {
    return vec2(2 * (event.clientX - canvas.offsetLeft) / canvas.width - 1,
        2 * (canvas.height - event.clientY + canvas.offsetTop) / canvas.height - 1);
}
