
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var grid;
var evalFrame;
var updateInt;
var running = false;
var botCodeCtrl = document.getElementById("botCode");
var canMaxX = 400;
var canMaxY = 400;
var squareSize = 10;
var gridMaxX = (canMaxX / squareSize) - 1;
var gridMaxY = (canMaxY / squareSize) - 1;
var allowRealtimeEdit = true;
var levelNum = 1;
var levelPkg;
var maxLevel = 12;
var failedLevel = false;

// Create the current level and draw the initial state
function initLevel() {
	buildLevel(levelNum);
	draw(null);
}

// Validate that the grid has not been tampered with.
function validateReturnedGrid(returnedGrid) {

	if (returnedGrid.length != grid.length) {
		return 'Error: Cannot modifiy grid';
	} else {
		for (var i = 0; i < grid.length; i++) {
			if (grid[i].id != returnedGrid[i].id) return 'Error: Cannot modifiy grid';
		}
	}

	return null;
}

// Response from the Sandbox. The event data contains a copy of the grid with the updated bot actions.
function evalResponse(event) {
	if (running) {
		// Validate that the grid was not directly modified.
		var err = validateReturnedGrid(event.data.grid);
		if (err != null) {
			event.data.valid = false;
			event.data.err = err;
		}

		if (event.data.valid) {
			// Just copy the dir, action and mem for each bot so any other changes are discarded (no cheating!)
			for (var i = 0; i < grid.length; i++) {
				// Update any bots
				if (grid[i].userControlled) {
					grid[i].dir = event.data.grid[i].dir;
					grid[i].action = event.data.grid[i].action;
					grid[i].mem = event.data.grid[i].mem;

					// Trim to the 1st char
					if (typeof grid[i].dir == 'string')
						grid[i].dir = grid[i].dir.charAt(0);

					if (typeof grid[i].action == 'string')
						grid[i].action = grid[i].action.charAt(0);
				}
			}

			// Have the grid take action
			gridActions();

			// Draw the final results
			draw(null);

			// See if victory has been achieved
			var victory = victoryCheck();

			if (victory) {
				showVictory();
				return;
			}

		} else {
			// There was error in the Sandbox.
			// Most likely invalid code. Show the error.
			draw(event.data.err);
		}

		// Increase the loop counter
		levelPkg.count++;

		// Get the speed for the next iteration
		var speed = document.getElementById('speed').value;
		var FPS = 30 * (speed * .01);
		updateInt = setTimeout(function () { update(); }, 1000 / FPS);
	}
}

// Apply any AI routines to grid objects.
// This includes tick counters for bombs.
function gridAI(gridObj) {

	if (gridObj.ticks > 0) {
		gridObj.ticks--;
	}

	// Check if a bomb
	if (gridObj.type == 'bomb' && gridObj.ticks == 0) { // BOOOMMMMMM!!!!
		gridObj.alive = false;
		var destroyed = objectsAroundPositionGet(gridObj.x, gridObj.y, gridObj.range, gridObj.id);

		for (var d = 0; d < destroyed.length; d++) {
			destroyed[d].alive = false;
		}
	}

	// Does this grid object have an AI?
	if (gridObj.ai) {
		gridObj.action = null;
		gridObj.dir = null;
		var moveToX = 999;
		var moveToY = 999;
		var delta;

		if (gridObj.ai == 'linebot') { // This AI will move towards closest bot in same row or col

			for (var i = 0; i < grid.length; i++) {
				if (grid[i].id != gridObj.id && grid[i].alive && grid[i].team != gridObj.team) {
					if (grid[i].x == gridObj.x) {
						delta = Math.abs(gridObj.y - grid[i].y);
						moveToY = (delta < moveToY) ? grid[i].y : moveToY;
					} else if (grid[i].y == gridObj.y) {
						delta = Math.abs(gridObj.x - grid[i].x);
						moveToX = (delta < moveToX) ? grid[i].x : moveToX;
					}
				}
			}
		} else if (gridObj.ai == 'hunter') { // This AI will move towards closest bot anywhere
			var closest = 9999;

			for (var i = 0; i < grid.length; i++) {
				if (grid[i].id != gridObj.id && grid[i].alive && grid[i].team != gridObj.team) {
					var dist = distance(gridObj.x, gridObj.y, grid[i].x, grid[i].y);
					if (dist.totalDist < closest) {
						closest = dist.totalDist;
						if (dist.xDist > dist.yDist) {
							moveToX = grid[i].x;
							moveToY = 999;
						} else {
							moveToY = grid[i].y;
							moveToX = 999;
						}
					}
				}
			}
		}

		// See if AI routine ordered move towards an X or Y
		if (moveToX != 999 || moveToY != 999) {
			gridObj.action = 1;

			if (moveToX < moveToY) {
				gridObj.dir = (moveToX < gridObj.x) ? 4 : 2;
			} else {
				gridObj.dir = (moveToY < gridObj.y) ? 1 : 3;
			}
		}
	}
}

// Have each object on the grid take their action
function gridActions() {
	for (var i = 0; i < grid.length; i++) {
		var gridObj = grid[i];
			
		// Only objects that are alive and that have not found the exit will act
		if (gridObj.alive && !gridObj.victory) {
			var collision = null;

			// See if any AI controls the object
			gridAI(gridObj);

			// Does the object want to move?
			if (gridObj.action == 'm' || gridObj.action == 1) {
				// See if the object will collide with something solid. If so, don't move.
				collision = objectInDirectionGet(gridObj);

				// Ok to move if...
				if (collision == null || // No collision
					!collision.solid || // Collision, but object is not solid
					((gridObj.kills || collision.kills) && (collision.team != gridObj.team))) { // Collision with a solid object but the object(s) kills member of other team
					switch (gridObj.dir) {
						case 'u':
						case 'n':
						case 1:
							gridObj.y--; break;

						case 'r':
						case 'e':
						case 2:
							gridObj.x++; break;

						case 'd':
						case 's':
						case 3:
							gridObj.y++; break;

						case 'l':
						case 'w':
						case 4:
							gridObj.x--; break;
					}
				}
			// Does the object want to drop a bomb?
			} else if (gridObj.action == 'b' || gridObj.action == 2) {
				if (gridObj.bombs > 0) {
					gridObj.bombs--;
					grid.push(new gridBase(gridObj.x, gridObj.y, 'bomb'));
				}
			}

			// bounds check
			if (gridObj.x < 0) gridObj.x = 0;
			if (gridObj.x > gridMaxX) gridObj.x = gridMaxX;
			if (gridObj.y < 0) gridObj.y = 0;
			if (gridObj.y > gridMaxY) gridObj.y = gridMaxY;

			// Check if the gridObj has collided with anything
			if (collision != null) {

				if (collision.kills && collision.team != gridObj.team) {
					gridObj.alive = false;
				} else if (collision.exit && gridObj.userControlled) {
					gridObj.victory = true;
				}

				if (gridObj.kills && collision.team != gridObj.team) {
					collision.alive = false;
				}
			}
			
		}
	}
}

function victoryCheck() {
	var victory = true;

	for (var i = 0; i < grid.length; i++) {
		if (grid[i].userControlled) {
			if (!grid[i].victory) victory = false;
			if (!grid[i].alive) failedLevel = true;
		}
	}

	return victory;
}

function update() {
	var botCode = botCodeCtrl.value;
	levelPkg.botCode = botCode;

	evalFrame.postMessage(levelPkg, "*");
}

function draw(message) {
	canvas.width = canvas.width; // Clears canvas
	drawGrid();

	for (var i = 0; i < grid.length; i++) {
		if (grid[i].alive) {
			var drawX = grid[i].x * squareSize;
			var drawY = grid[i].y * squareSize;

			ctx.beginPath();
			ctx.rect(drawX, drawY, squareSize, squareSize);
			ctx.fillStyle = grid[i].color;
			ctx.fill();

			if (grid[i].bombs > 0) {
				ctx.font = "10px Arial";
				ctx.fillStyle = "white";
				ctx.fillText("B", drawX + 2, drawY + (squareSize-2));
			}

			if (grid[i].exit) {
				ctx.font = "14px Arial";
				ctx.fillStyle = "white";
				ctx.fillText("X", drawX + 1, drawY + (squareSize - 1));
			}
		}
	}

	if (failedLevel && levelNum != 0) {
		ctx.font = "72px Arial";
		ctx.fillStyle = "red";
		ctx.fillText("FAILED!", 70, 150);
	}

	if (message) {
		ctx.font = "18px Arial";
		ctx.fillStyle = "purple";
		ctx.fillText(message, 5, 30, canMaxX - 10);
	}
}

function showVictory() {
	startStop();

	ctx.font = "72px Arial";
	ctx.fillStyle = "green";
	ctx.fillText("VICTORY!", 30, 150);
}

function drawGrid() {
	for (var x = 0; x < canMaxX; x += squareSize) {
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canMaxY);
		ctx.stroke();
	}

	for (var y = 0; y < canMaxY; y += squareSize) {
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(0, y);
		ctx.lineTo(canMaxX, y);
		ctx.stroke();
	}
}

function startStop() {
	if (updateInt)
		clearTimeout(updateInt);

	var button = document.getElementById("btnStart");

	if (running) {
		button.value = 'Start';
		running = false;
		botCodeCtrl.disabled = false;
	} else {
		button.value = 'Stop';
		running = true;
		botCodeCtrl.disabled = !allowRealtimeEdit;

		initLevel();
		update();
	}
}

function nextLevel() {
	if (running) {
		startStop();
	}

	levelNum = levelNum == maxLevel ? 1 : levelNum + 1;
	initLevel();
}

function showGridCoords(event) {
	var adj = -3;
	document.getElementById("divGridCoords").innerHTML = "Mouse X/Y Grid Position: " + Math.floor((event.offsetX+adj)/10) + ", " + Math.floor((event.offsetY+adj)/10);
}


evalFrame = document.getElementById("evalFrame").contentWindow;

window.addEventListener("message", evalResponse, false);

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('btnStart').addEventListener('click', startStop);
	document.getElementById('btnNext').addEventListener('click', nextLevel);
	document.getElementById('btnCloseInstr').addEventListener('click', function () { document.getElementById("instructions").style.display = 'none'; });
	document.getElementById('btnHelp').addEventListener('click', function () { document.getElementById("instructions").style.display = 'inline'; });
	document.getElementById('myCanvas').addEventListener('mousemove', showGridCoords);
});

initLevel();
