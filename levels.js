
var nextId = 1;

var gridBase = function (xStart, yStart, type) {
	this.id = nextId++,
	this.x = xStart,
	this.y = yStart,
	this.type = type
	this.action = null,
	this.dir = null,
	this.bombs = 0,
	this.mem = null,
	this.kills = false;
	this.solid = false;
	this.exit = false;
	this.userControlled = false;
	this.ai = null;
	this.ticks = 0;
	this.range = 0;
	this.alive = true;
	this.victory = false;
	this.team = 1;

	switch (type) {
		case 'bot': this.color = 'blue'; this.solid = true; this.userControlled = true; this.team = 2; break;
		case 'fire': this.kills = true; this.color = 'red'; break;
		case 'exit': this.exit = true; this.color = 'green'; break;
		case 'wall': this.solid = true; this.color = 'black'; break;
		case 'linebot': this.kills = true; this.color = 'orange'; this.ai = 'linebot'; break;
		case 'hunter': this.kills = true; this.color = '#ff5555', this.ai = 'hunter'; break;
		case 'bomb': this.color = 'brown'; this.ticks = 4; this.range = 1; break;
		
		default:
			throw UserException('Unknown gridBase type');
	}
}

function buildLevel(levelNum) {

	var instructions;
	victoryCount = 0;
	failedLevel = false;
	grid = new Array();
	nextId = 1;

	if (levelNum == 0) { // Test level...random locations
		for (var i = 0; i < 100; i++) {
			grid.push(new gridBase(Math.floor(Math.random() * (gridMaxX + 1)), Math.floor(Math.random() * (gridMaxX + 1)), 'bot'));
		}

		/*
		for (var i = 0; i < grid.length; i++) {
			grid.push(new gridBase(Math.floor(Math.random() * (gridMaxX + 1)), Math.floor(Math.random() * (gridMaxX + 1)), 'fire'));
		}
		*/

		//grid.push(new gridBase(20, 20, 'hunter'));

		instructions = "<h3>Random Testing Grounds</h3>HAVE FUN!!!";
	} else if (levelNum == 1) { // Level 1
		grid.push(new gridBase(10, 20, 'bot')); 
		grid.push(new gridBase(35, 20, 'exit'));

		instructions = "<h3>Easy Squeezy</h3>Just guide your bot to the exit.<br/>Remember: bot.action=1 or bot.action='m' will get your bot moving.<br/>Then just set bot.dir to a direction to finish the job. (hint: bot.dir=2 or 'r' or 'e')";
	} else if (levelNum == 2) { // Level 2
		grid.push(new gridBase(10, 10, 'bot'));

		for (var i = 0; i < 40; i++) {
			var type = 'wall';
			var x = 20;

			if (i == 20) {
				type = 'exit';
				x = 35
			}

			grid.push(new gridBase(x, i, type));
		}

		instructions = "<h3>The Wall</h3>You cannot pass through the walls. See if you can guide your bot through the opening.<br/>Remember: You can check 'bot.x', 'bot.y' or even 'objectInDirectionGet(bot)' to detect when a bot reaches a certain spot on the grid or nears a collision and change course accordingly.";
	} else if (levelNum == 3) { // Level 3
		grid.push(new gridBase(10, 20, 'bot'));

		grid.push(new gridBase(35, 20, 'exit'));
		grid.push(new gridBase(25, 19, 'fire'));
		grid.push(new gridBase(25, 20, 'fire'));
		grid.push(new gridBase(25, 21, 'fire'));

		instructions = "<h3>Fire Drill</h3>Guide your bot around the fire to get to the exit.<br/>Remember: Another option is to check the value of 'count' to see how many iterations have past and issue different commands once a certain number is reached.";
	} else if (levelNum == 4) { // Level 4
		grid.push(new gridBase(10, 10, 'bot'));
		grid.push(new gridBase(10, 30, 'bot'));

		for (var i = 0; i < 40; i++) {
			var type = 'fire';
			var x = 20;

			if (i == 20) {
				type = 'exit';
				x = 35
			}

			grid.push(new gridBase(x, i, type));
		}

		instructions = "<h3>Fire Drill - Part 2</h3>Can you get them both to the exit?<br/>Remember: All bots run the same code, but 'i' or 'botNum' can be checked to give different instructions to different grid. You can also check 'bot.y' and control movements that way.";
	} else if (levelNum == 5) { // Level 5
		grid.push(new gridBase(10, 19, 'bot'));
		grid.push(new gridBase(10, 21, 'bot'));

		grid.push(new gridBase(30, 20, 'linebot'));
		grid.push(new gridBase(35, 20, 'exit'));

		instructions = "<h3>Laning</h3>Look out for the lane bots. They will move towards other bots in the same row or column on the grid.";
	} else if (levelNum == 6) { // Level 6
		grid.push(new gridBase(10, 20, 'bot'));
		grid[0].bombs = 1;

		for (var i = 0; i < 40; i++) {
			grid.push(new gridBase(20, i, 'wall'));
		}

		grid.push(new gridBase(30, 20, 'exit'));

		instructions = "<h3>Bombs Away</h3>Your bot has a bomb it can drop. Set bot.action=2 or 'b' to drop a bomb. It will destroy everything within 1 square. Your bot has 3 ticks to move away before it blows. This may be a good time to use 'bot.mem'. Different values can signal different stages of code to execute.";
	} else if (levelNum == 7) { // Level 7
		grid.push(new gridBase(0, 0, 'bot'));
		grid.push(new gridBase(0, 1, 'bot'));

		var y = 0;
		for (var x = 1; x < 40; x++) {
			grid.push(new gridBase(x, y, 'wall'));
			y++;
		}

		y = 2;
		for (var x = 0; x < 38; x++) {
			grid.push(new gridBase(x, y, 'wall'));
			y++;
		}

		grid.push(new gridBase(39, 39, 'exit'));

		instructions = "<h3>Zig-Zag</h3>Can your bots navigate this back-n-forth hall?";
	} else if (levelNum == 8) { // Level 8
		
		grid.push(new gridBase(17, 17, 'bot'));
		grid.push(new gridBase(23, 17, 'bot'));
		grid.push(new gridBase(23, 23, 'bot'));
		grid.push(new gridBase(17, 23, 'bot'));

		for (var x = 15; x <= 25; x++) {
			for (var y = 15; y <= 25; y++) {
				if ((x == 15 || x == 25 || y == 15 || y == 25) &&
					!(x==20 && y == 15) /* Leave a door */) {
					grid.push(new gridBase(x, y, 'wall'));
				}
			}
		}

		grid.push(new gridBase(20, 35, 'exit'));

		instructions = "<h3>Room To Move</h3>Get your bots out of this room and to the exit.";
	} else if (levelNum == 9) { // Level 9

		grid.push(new gridBase(5, 11, 'bot'));
		grid.push(new gridBase(37, 3, 'bot'));
		grid.push(new gridBase(16, 31, 'bot'));
		grid.push(new gridBase(29, 38, 'bot'));

		for (var x = 15; x <= 25; x++) {
			for (var y = 15; y <= 25; y++) {
				if ((x == 15 || x == 25 || y == 15 || y == 25) &&
					!(x == 20 && y == 15) /* Leave a door */) {
					grid.push(new gridBase(x, y, 'wall'));
				}
			}
		}

		grid.push(new gridBase(17, 20, 'exit'));
		grid.push(new gridBase(3, 11, 'linebot'));
		grid.push(new gridBase(16, 28, 'linebot'));

		instructions = "<h3>Outside Looking In</h3>This time get your bots into this room and to the exit.";
	} else if (levelNum == 10) { // Level 10

		grid.push(new gridBase(5, 5, 'bot'));
		grid[0].bombs = 1;
		grid.push(new gridBase(35, 5, 'bot'));
		grid[1].bombs = 1;

		grid.push(new gridBase(20, 35, 'exit'));
		grid.push(new gridBase(20, 20, 'hunter'));

		instructions = "<h3>Hunting Wabbits</h3>Meet the Hunter Bot. It will go straight towards the nearest bot. Fortunately you have bombs!";
	} else if (levelNum == 11) { // Level 11

		grid.push(new gridBase(11, 7, 'bot'));
		grid[0].bombs = 1;
		grid.push(new gridBase(23, 13, 'bot'));
		grid[1].bombs = 1;
		grid.push(new gridBase(38, 21, 'bot'));
		grid[2].bombs = 1;
		grid.push(new gridBase(18, 35, 'bot'));
		grid[3].bombs = 1;

		for (var x = 0; x < 40; x++) {
			for (var y = 0; y < 40; y++) {
				if (x == 15 || x == 25 || y == 15 || y == 25) {
					grid.push(new gridBase(x, y, 'wall'));
				}
			}
		}

		grid.push(new gridBase(20, 20, 'exit'));

		instructions = "<h3>I'll Huff And I'll Puff</h3>A bomb or four may help you break in.";
	} else if (levelNum == 12) { // Level 12

		grid.push(new gridBase(0, 0, 'bot'));
		grid.push(new gridBase(0, 1, 'wall'));
		var x = 1;
		var y = 1;
		var length = 38;
		var dir = 2;

		for (var i = 0; i < 9; i++) {
			for (var t = 0; t < 4; t++) {
				for (var l = 1; l < length; l++) {
					grid.push(new gridBase(x, y, 'wall'));

					if (dir == 1) y--; else if (dir == 2) x++; else if (dir == 3) y++; else x--;
				}

				dir = dir == 4 ? 1 : dir + 1;
				if (dir == 1) length-=2;
			}

			grid.push(new gridBase(x, y, 'wall'));
			x++;
			grid.push(new gridBase(x, y, 'wall'));
			x++;
			length -= 2
		}

		grid.push(new gridBase(18, 20, 'exit'));

		instructions = "<h3>Around And Around We Go</h3>I hope your bot doesn't get dizzy!";
	}

	// Display the level instructions
	instructions = "<h1>Level " + levelNum + "</h1>" + instructions;
	document.getElementById("divLevelHelp").innerHTML = instructions;

	// Create the package
	levelPkg = {
		grid: grid,
		maxX: gridMaxX,
		maxY: gridMaxY,
		count: 1
	};

	failedLevel = false;
}