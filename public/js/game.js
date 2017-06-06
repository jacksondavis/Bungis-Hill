var DEBUG = true;
var INTERVAL = 50;
var ARENA_MARGIN = 30;

function Game(arenaId, w, h, socket){
	this.players = []; // Players (other than the local player)
	this.width = w;
	this.height = h;
	this.$arena = $(arenaId);
	this.$arena.css('width', w);
	this.$arena.css('height', h);
	this.socket = socket;

	var g = this;
	setInterval(function(){
		g.mainLoop();
	}, INTERVAL);
}

Game.prototype = {

	addPlayer: function(id, type, isLocal, x, y){
		var p = new Player(id, type, this.$arena, this, isLocal, x, y);
		if(isLocal){
			this.localPlayer = p;
		}else{
			this.players.push(p);
		}
	},

	removePlayer: function(playerId){
		// Remove player object
		this.players = this.players.filter( function(p){return p.id != playerId} );
		// Remove player from dom
		$('#' + playerId).remove();
		$('#info-' + playerId).remove();
	},

	mainLoop: function(){
		if(this.localPlayer != undefined){
			// Send data to server about local player
			this.sendData();
			// Move local player
			this.localPlayer.move();
		}
	},

	sendData: function(){
		// Send local data to server
		var gameData = {};

		// Send player data
		var p = {
			id: this.localPlayer.id,
			x: this.localPlayer.x,
			y: this.localPlayer.y,
		};
		gameData.player = p;

		this.socket.emit('sync', gameData);
	},

	receiveData: function(serverData) {
		var game = this;

		serverData.players.forEach( function(serverPlayer){

			// Update foreign players
			var found = false;
			game.players.forEach( function(clientPlayer){
				if(clientPlayer.id == serverPlayer.id){
					clientPlayer.x = serverPlayer.x;
					clientPlayer.y = serverPlayer.y;
					clientPlayer.refresh();
					found = true;
				}
			});
			if(!found &&
				(game.localPlayer == undefined || serverPlayer.id != game.localPlayer.id)){
				//I need to create it
				game.addPlayer(serverPlayer.id, serverPlayer.type, false, serverPlayer.x, serverPlayer.y, serverPlayer.hp);
			}
		});
	}
}

function Player(id, type, $arena, game, isLocal, x, y, hp){
	this.id = id;
	this.type = type;
	this.$arena = $arena;
	// Max speed
	this.speed = 10;
	// Friction
	this.friction = 0.90;
	// Current X and Y velocities
	this.velX = 0;
	this.velY = 0;
	// Current position
	this.x = x;
	this.y = y;
	this.mx = null;
	this.my = null;
	// Associated width and height of player
	this.w = 60;
	this.h = 60;
	this.dir = {
		up: false,
		down: false,
		left: false,
		right: false
	};
	this.game = game;
	this.isLocal = isLocal;

	this.materialize();
}

Player.prototype = {

	materialize: function(){
		this.$arena.append('<div id="' + this.id + '" class="player player' + this.type + '"></div>');
		this.$body = $('#' + this.id);
		this.$body.css('width', this.w);
		this.$body.css('height', this.h);

		this.$arena.append('<div id="info-' + this.id + '" class="info"></div>');
		this.$info = $('#info-' + this.id);
		this.$info.append('<div class="label">' + this.id + '</div>');

		this.refresh();

		if(this.isLocal){
			this.setControls();
		}
	},

	isMoving: function(){
		return this.dir.up || this.dir.down || this.dir.left || this.dir.right;
	},

	refresh: function(){
		this.$body.css('left', this.x - (this.w/2.0) + 'px');
		this.$body.css('top', this.y - 50 + 'px');

		this.$info.css('left', (this.x) + 'px');
		this.$info.css('top', (this.y) + 'px');

	},

	setControls: function(){
		var t = this;

		/* Detect both keypress and keyup to allow multiple keys
		 and combined directions */
		$(document).keypress( function(e){
			var k = e.keyCode || e.which;
			switch(k){
				case 119: //W
					t.dir.up = true;
					break;
				case 100: //D
					t.dir.right = true;
					break;
				case 115: //S
					t.dir.down = true;
					break;
				case 97: //A
					t.dir.left = true;
					break;
			}

		}).keyup( function(e){
			var k = e.keyCode || e.which;
			switch(k){
				case 87: //W
					t.dir.up = false;
					break;
				case 68: //D
					t.dir.right = false;
					break;
				case 83: //S
					t.dir.down = false;
					break;
				case 65: //A
					t.dir.left = false;
					break;
			}
		})

	},

	move: function(){
		if (this.dir.up) {
			if (this.velY > -this.speed) {
				this.velY--;
			};
		}
		if (this.dir.down) {
			if (this.velY < this.speed) {
				this.velY++;
			}
		}
		if (this.dir.left) {
			if (this.velX > -this.speed) {
				this.velX--;
			}
		}
		if (this.dir.right) {
			if (this.velX < this.speed) {
				this.velX++;
			}
		}

		// Apply friction to velocities
		this.velX *= this.friction;
		this.velY *= this.friction;

		// // Move if bound constraints are satisfied
		if(this.x + this.velX > ARENA_MARGIN && (this.x + this.velX) < (this.$arena.width() - ARENA_MARGIN)){
			this.x += this.velX;
		} else {
			this.velX = 0;
		}
		if(this.y + this.velY > ARENA_MARGIN + 30 && (this.y + this.velY) < (this.$arena.height() - ARENA_MARGIN)){
			this.y += this.velY;
		} else {
			this.velY = 0;
		}
		this.refresh();
	}
}


function debug(msg){
	if(DEBUG){
		console.log(msg);
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
