var DEBUG = true;
var INTERVAL = 50;
var ROTATION_SPEED = 5;
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
	this.speed = 5;
	this.$arena = $arena;
	this.w = 60;
	this.h = 80;
	this.x = x;
	this.y = y;
	this.mx = null;
	this.my = null;
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
		this.$body.css('left', this.x - 30 + 'px');
		this.$body.css('top', this.y - 40 + 'px');
		
		this.$info.css('left', (this.x) + 'px');
		this.$info.css('top', (this.y) + 'px');
		if(this.isMoving()){
			this.$info.addClass('fade');
		}else{
			this.$info.removeClass('fade');
		}

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

		var moveX = 0;
		var moveY = 0;

		if (this.dir.up) {
			moveY = -1;
		} else if (this.dir.down) {
			moveY = 1;
		}
		if (this.dir.left) {
			moveX = -1;
		} else if (this.dir.right) {
			moveX = 1;
		}

		moveX = this.speed * moveX;
		moveY = this.speed * moveY;

		if(this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (this.$arena.width() - ARENA_MARGIN)){
			this.x += moveX;
		}
		if(this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < (this.$arena.height() - ARENA_MARGIN)){
			this.y += moveY;
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