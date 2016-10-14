function Piece(initialTriangle, trianglePos, bufferOffset) {
	this.bufferOffset = bufferOffset;
	this.triangle = initialTriangle;
	this.trianglePos = trianglePos;

	this.center = [ triangleRef[this.triangle][0] + triangleWidth / 2,
		            triangleRef[this.triangle][1] + triangleWidth / 2 + triangleWidth * this.trianglePos ];
	this.numRimPoints = pieceNumPoints / 2;

	this.updatePoints = function(dx, dy) {
        this.center[0] += dx;
        this.center[1] += dy;

	    var points = [];

	    var theta = radians(360) / this.numRimPoints;
	    var currAngle = 0;
	    for (var i = 0; i < this.numRimPoints; i++) {
	        points.push(vec4(   pieceRadius * Math.cos(currAngle) + this.center[0],
                                boardOffset / 2,
	                            pieceRadius * Math.sin(currAngle) + this.center[1]));
	        currAngle += theta;
    	}

    	currAngle = 0;
        for (i = 0; i < this.numRimPoints; i++) {
	        points.push(vec4(   pieceRadius * Math.cos(currAngle) + this.center[0],
                                boardOffset,
	                            pieceRadius * Math.sin(currAngle) + this.center[1]));
	        currAngle += theta;
    	}

    	// TODO: do buffer things

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * bufferOffset, flatten(points));
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
            i + this.numRimPoints,
            (i + 1) % this.numRimPoints])
    }

    indices = concatAndOffset(indices, ind, bufferOffset);

    this.updatePoints(0, 0);
}
