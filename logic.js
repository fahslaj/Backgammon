var GameState = {
	turn: 0,
	dice: [-1, -1],
	board: {
		triangles: [],
		bar: []
	},
	winner: undefined
}

// from the perspective of player 0
var pieceMappy = {
	23: [0, 0],
	12: [0, 0, 0, 0, 0],
	7:  [0, 0, 0],
	5:  [0, 0, 0, 0, 0],

	0:  [1, 1],
	11: [1, 1, 1, 1, 1],
	16: [1, 1, 1],
	18: [1, 1, 1, 1, 1]
}

for (var i = 0; i < 24; i++) {
	if (pieceMappy[i]) {
		GameState.board.triangles[i] = pieceMappy[i];
	} else {
		GameState.board.triangles[i] = [];
	}
}

function rollDie(diePosition) {
	dice[diePosition] = Math.floor(Math.random()*6) + 1;
}
