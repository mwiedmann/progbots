function UserException(message) {
	this.message = message;
	this.name = "UserException";
}

function objectAtPositionGet(x, y, idToIgnore) {
	for (var g = 0; g < grid.length; g++) {
		var obj = grid[g];

		if (obj.id != idToIgnore && obj.alive && !obj.victory && obj.x == x && obj.y == y) {
			return obj;
		}
	}

	return null;
}

function objectsAroundPositionGet(xOrig, yOrig, range, ignoreId) {
	var results = new Array();

	for (var x = xOrig - range; x <= xOrig + range; x++) {
		for (var y = yOrig - range; y <= yOrig + range; y++) {
			var obj = objectAtPositionGet(x, y, ignoreId);

			if (obj != null) {
				results.push(obj);
			}
		}
	}

	return results;
}

function distance(x1, y1, x2, y2) {
	return {
		totalDist: Math.sqrt(Math.abs((x1 - x2) * (x1 - x2)) + Math.abs((y1 - y2) * (y1 - y2))),
		xDist: Math.abs(x1 - x2),
		yDist: Math.abs(y1 - y2)
	}
}

function objectInDirectionGet(obj) {
	var x = obj.x;
	var y = obj.y;

	if (obj.dir == 1 || obj.dir == 'u' || obj.dir == 'n') y--;
	else if (obj.dir == 2 || obj.dir == 'r' || obj.dir == 'e') x++;
	else if (obj.dir == 3 || obj.dir == 'd' || obj.dir == 's') y++;
	else if (obj.dir == 4 || obj.dir == 'l' || obj.dir == 'w') x--;
	else throw new UserException('Invalid direction: ' + obj.dir);

	// If the bot is looking off the grid, return a temp/fake 'wall' as a helper
	if (x < 0 || x > 39 || y < 0 || y > 39) {
		return { x: x, y: y, type: 'wall', solid: true };
	} else {
		return objectAtPositionGet(x, y, obj.id);
	}
}