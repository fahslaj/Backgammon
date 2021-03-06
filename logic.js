/**
 *
 * Created by Joel Shapiro and Austin Fahsl
 *
 * */

// GameState variable to be watched by the UI
var GameState = {
	turn: -1,
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

// tracking for the initialization of the game
var firstPlayerPicked = false;
var rollDone = false;

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
// initialize GameState.board
for (var i = 0; i < 24; i++) {
	if (pieceMappy[i]) {
		GameState.board.triangles[i] = pieceMappy[i];
	} else {
		GameState.board.triangles[i] = [];
	}
}

/**
 * Roll the dice to set who goes first. If it is a draw,
 * this function must be called again.
 */
function rollForFirstTurn() {
	rollDie(1);
	rollDie(2);
	if (GameState.dice[1][0] > GameState.dice[2][0]) {
		GameState.turn = 0;
		firstPlayerPicked = true;
	} else if (GameState.dice[1][0] < GameState.dice[2][0]) {
		GameState.turn = 1;
		firstPlayerPicked = true;
	}
}

function rollDice() {
	rollDone = true;
	rollDie(1);
	rollDie(2);
}

/**
 * Roll the die at the given diePosition and set its 'used' value to false.
 * ***Note: the two dice are at positions 1 and 2
 */
function rollDie(diePosition) {
	GameState.dice[diePosition][0] = Math.floor(Math.random()*6) + 1;
	GameState.dice[diePosition][1] = 0;
}

function isGameInitialized() {
	return firstPlayerPicked && rollDone;
}

/**
 * Return all valid moves for the current GameState.
 */
function getValidMoves() {
	var moves = [];
	for (var startTriangle = 0; startTriangle < 25; startTriangle++) {
		for (var endTriangle = -1; endTriangle < 24; endTriangle++) {
			if (isValidMove(startTriangle, endTriangle)) {
				moves.push([startTriangle, endTriangle]);
			}
		}
	}
	return moves;
}

/**
 * Returns 0 (false) if not a valid move.
 * Returns 1 if is a valid move using die #1.
 * Returns 2 if is a valid move using die #2.
 * Returns 3 if is a valid move using both dice.
 */
function isValidMove(startTriangle, endTriangle) {
	if (!isGameInitialized()) {
		throw 'Game not initialized';
	}
	var validBarMoves = getValidBarMoves();
	if (validBarMoves.length != 0) {
		if (startTriangle != 24) {
			return false;
		}
		return isValidBarMove(endTriangle);
	}
	var player = GameState.turn;
	if (canBearOff() && endTriangle == -1) {
		return isValidBearOffMove(startTriangle, endTriangle)
	}
	if (!(startTriangle >= 0 && startTriangle < 24 && endTriangle >= 0 && endTriangle < 24)) {
		return false;
	}
	var isHit = false;
	if (GameState.board.triangles[startTriangle].length >= 1 &&
		GameState.board.triangles[startTriangle].indexOf(player) != -1 &&
		GameState.board.triangles[endTriangle].length <= 4) {
		if (GameState.board.triangles[endTriangle].indexOf(+!player) != -1) {
			var numOppPieces = 0;
			for (var i = 0; i < GameState.board.triangles[endTriangle].length; i++) {
				if (GameState.board.triangles[endTriangle][i] == !player) {
					numOppPieces++;
				}
			}
			if (numOppPieces > 1) {
				return false;
			}
		}
		if (endTriangle - startTriangle == GameState.dice[1][0] &&
			!GameState.dice[1][1]) {
			return 1;
		}
		if (endTriangle - startTriangle == GameState.dice[2][0] &&
			!GameState.dice[2][1]) {
			return 2;
		}
		if (endTriangle - startTriangle == GameState.dice[1][0] +
			GameState.dice[2][0] && !GameState.dice[1][1] &&
			!GameState.dice[2][1]) {
			return 3;
		}
	}
	return false;
}

/**
 * Check to see if this is a valid bearing off move.
 */
function isValidBearOffMove(startTriangle) {
	if (GameState.board.triangles[startTriangle].indexOf(GameState.turn) == -1) {
		return false;
	}
	if (!GameState.turn) {
		if (startTriangle - GameState.dice[1][0] < 0) {
			return 1;
		}
		if (startTriangle - GameState.dice[2][0] < 0) {
			return 2;
		}
		if (startTriangle - GameState.dice[1][0] - GameState.dice[2][0] < 0) {
			return 3;
		}
	} else {
		if (startTriangle + GameState.dice[1][0] > 23) {
			return 1;
		}
		if (startTriangle + GameState.dice[2][0] > 23) {
			return 2;
		}
		if (startTriangle + GameState.dice[3][0] > 23) {
			return 3;
		}
	}
	return false;
}

/**
 * Returns an array of valid moves for the current player that involves
 * taking pieces off of the bar. The 'startTriangle' value of each of the moves is -1.
 */
function getValidBarMoves() {
	var moves = [];
	for (var endTriangle = 0; endTriangle < 24; endTriangle++) {
		if (isValidBarMove(endTriangle)) {
			moves.push([24, endTriangle]);
		}
	}
	return moves;
}

/**
 * Returns 0 (false) if not a valid bar move.
 * Returns 1 if is a valid bar move using die #1.
 * Returns 2 if is a valid bar move using die #2.
 * Returns 3 if is a valid bar move using both dice.
 */
function isValidBarMove(endTriangle) {
	if (!isGameInitialized()) {
		throw 'Game not initialized';
	}
	if (GameState.board.bar.indexOf(GameState.turn) == -1) {
		return false;
	}
	var die1 = GameState.dice[1][0];
	var die2 = GameState.dice[2][0];
	var triangle1;
	var triangle2;
	var triangle3;
	if (!GameState.turn) {
		triangle1 = 24 - die1;
		triangle2 = 24 - die2;
		triangle3 = 24 - die1 - die2;
	} else {
		triangle1 = die1 - 1;
		triangle2 = die2 - 1;
		triangle3 = die1 + die2 - 1;
	}
	if (endTriangle == triangle1 && (GameState.board.triangles[triangle1].indexOf(+!GameState.turn) == -1 
										|| GameState.board.triangles[triangle1].length == 1)) {
		return 1;
	} else if (endTriangle == triangle2 && (GameState.board.triangles[triangle2].indexOf(+!GameState.turn) == -1 
										|| GameState.board.triangles[triangle2].length == 1)) {
		return 2;
	} else if (endTriangle == triangle3 && (GameState.board.triangles[triangle3].indexOf(+!GameState.turn) == -1 
										|| GameState.board.triangles[triangle3].length == 1)) {
		return 3;
	}
	return false;
}

/**
 * Returns the index i for which listy[i] == element.
 * If element is not in listy, returns -1;
 */
function contains(listy, element) {
	for (var i = 0; i < listy.length; i++) {
		if (listy[i] == element) {
			return i;
		}
	}
	return -1;
}

/**
 * Move one piece from startTriangle to the endTriangle. Moves the
 * current player's piece only, and will not make an invalid move.
 * TODO: add accounting for doubles being 'doubled'
 */
function makeMove(startTriangle, endTriangle) {
	// check for valid move & get dice used
	var die = isValidMove(startTriangle, endTriangle);
	if (!die) {
		throw 'Invalid move: ' + startTriangle + ' -> ' + endTriangle;
	}

	// move the piece
	var pieceToMove = -1;
	var hitPiece = -1;
	if (startTriangle == 24) {
		for (var i = 0; i < GameState.board.bar.length; i++) {
			if (GameState.board.bar[i] == GameState.turn) {
				pieceToMove = GameState.board.bar.splice(i, 1)[0];
				break;
			}
		}
	} else {
		pieceToMove = GameState.board.triangles[startTriangle].pop();
	}
	if (endTriangle == -1) {
		// do nothing, piece is being removed :)
	} else if (GameState.board.triangles[endTriangle].indexOf(+!GameState.turn) != -1) {
		// must only be 1 piece in the list, or isValidMove fails
		hitPiece = GameState.board.triangles[endTriangle].pop();
		GameState.board.bar.push(hitPiece);
	} else {
		GameState.board.triangles[endTriangle].push(pieceToMove);
	}

	// update dice
	if (die == 3) {
		GameState.dice[1][1] = 1;
		GameState.dice[2][1] = 1;
	} else {
		GameState.dice[die][1] = 1;
	}
}

/**
 * Switch to the other player's turn. 
 */
function endTurn() {
	var moves = getValidMoves();
	if (moves.length != 0) {
		throw {
			message: "Turn is not finished.",
			validMoves: moves
		};
	}
	if (!checkWin()) {
		rollDone = false;
		GameState.turn = +!GameState.turn;
	}
}

/**
 * Check to see if the current player can move to
 * remove pieces from the board.
 */
function canBearOff() {
	if (!GameState.turn) {
		for (var i = 6; i < GameState.board.triangles.length; i++) {
			if (GameState.board.triangles[i].indexOf(GameState.turn) != -1) {
				return false;
			}
		}
	} else {
		for (var i = 0; i < GameState.board.triangles.length - 6; i++) {
			if (GameState.board.triangles[i].indexOf(GameState.turn) != -1) {
				return false;
			}
		}
	}
	if (GameState.board.bar.indexOf(GameState.turn) != -1) {
		return false;
	}
	return true;
}

/**
 * Check for win conditions.
 */
function checkWin() {
	var foundPlayerPiece = false;
	if (GameState.turn == -1) {
		return false;
	}
	for (var i = 0; i < GameState.board.triangles.length; i++) {
		if (GameState.board.triangles[i].indexOf(GameState.turn) != -1) {
			foundPlayerPiece = true;
			break;
		}
	}
	var foundOppPiece = false;
	for (var i = 0; i < GameState.board.triangles.length; i++) {
		if (GameState.board.triangles[i].indexOf(+!GameState.turn) != -1) {
			foundOppPiece = true;
			break;
		}
	}
	if (GameState.board.bar.indexOf(GameState.turn) != -1) {
		foundPlayerPiece = true;
	}
	if (GameState.board.bar.indexOf(+!GameState.turn) != -1) {
		foundOppPiece = true;
	}
	if (!foundPlayerPiece && !foundOppPiece) {
		throw 'Invalid game state: Draw';
	} else if (foundPlayerPiece && foundOppPiece) {
		return false;
	} else if (foundPlayerPiece) {
		GameState.winner = GameState.turn;
		return true;
	} else if (foundOppPiece) {
		GameState.winner = +!GameState.turn;
		return true;
	}
}
