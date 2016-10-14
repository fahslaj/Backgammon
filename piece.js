function Piece(initialTriangle, trianglePos, bufferOffset) {
	this.bufferOffset = bufferOffset;
	this.triangle = initialTriangle;
	this.trianglePos = trianglePos;

	this.center = [triangleRef[this.triangle][0] + triangleWidth / 2, 
		triangleRef[this.triangle][1] + triangleWidth / 2 + 
		triangleWidth * this.trianglePos];
	this.numRimPoints = pieceNumPoints / 2;
	this.mapping = initMapping();

	this.updatePoints = function(dx, dy) {
	    var points = [];
	    var angle = radians(360) / this.numRimPoints;
	    var currAngle = 0;

	    for (var i = 0; i < this.numRimPoints; i++) {
	        points.push(vec4(pieceRadius * Math.cos(currAngle) + this.center[0], boardOffset / 2,
	                        pieceRadius * Math.sin(currAngle) + this.center[1]));
	        currAngle += angle;
    	}
    	currAngle = 0;
    	for (var i = 0; i < this.numRimPoints; i++) {
	        points.push(vec4(pieceRadius * Math.cos(currAngle) + this.center[0], boardOffset,
	                        pieceRadius * Math.sin(currAngle) + this.center[1]));
	        currAngle += angle;
    	}

    	// TODO: do buffer things
	}

	function initMapping() {
		var mapping = [];
    	for (var i = 0; i < numRimPoints - 1; i++) {
			mapping.push(i, i + 1, i + numRimPoints, i + numRimPoints + 1);
		}
		return mapping;
	}
}