var GameState = {
	turn: 0,
	bearing: 0,
	dice: {
		1: [-1, 0],
		2: [-1, 0]
	},
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
	GameState.dice[diePosition][0] = Math.floor(Math.random()*6) + 1;
	GameState.dice[diePosition][1] = 0;
}

function isValidMove(startTriangle, endTriangle) {
	var player = GameState.turn;
	if (GameState.board.triangles[startTriangle].length >= 1 &&
		GameState.board.triangles[startTriangle].indexOf(player) != -1 &&
		GameState.board.triangles[endTriangle].length <= 4 &&
		GameState.board.triangles[endTriangle].indexOf(!player) == -1) {
		if (endTriangle - startTriangle == GameState.dice[0][0] &&
			!GameState.dice[0][1]) {
			return 1;
		}
		if (endTriangle - startTriangle == GameState.dice[1][0] &&
			!GameState.dice[1][1]) {
			return 2;
		} // TODO: check if uses both dice
	}
	return false;
}

function makeMove(startTriangle, endTriangle) {
	var die = isValidMove(startTriangle, endTriangle);
	if (!die) {
		throw 'Invalid move';
	}
	GameState.board.triangles[endTriangle].push(
		GameState.board.triangles[startTriangle].pop());
	GameState.dice[die][1] = 1;
	if (GameState.dice[0][1] && GameState.dice[1][1]) {
		newTurn(); // TODO: change to next turn button
	}
}

function newTurn() {
	if (!checkWin()) {
		rollDie(0);
		rollDie(1);
		GameState.turn = !GameState.turn;
	}
}

function checkWin() {
	// check for win conditions
}