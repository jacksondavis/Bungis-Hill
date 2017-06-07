var WIDTH = 1100;
var HEIGHT = 575;
// This IP is hardcoded to my server, replace with your own
var socket = io();
var game = new Game('#arena', WIDTH, HEIGHT, socket);
var selectedPlayer = 1;
var playerName  = '';
var isOverlay = false;

function toggleOverlay(){
	isOverlay = !isOverlay;
	if(isOverlay){
		document.getElementById('overlay').style.display = "block";
	}
	else{
		document.getElementById('overlay').style.display = "none";
	}
}

window.addEventListener('load', toggleOverlay, false);

socket.on('addPlayer', function(player){
	game.addPlayer(player.id, player.type, player.isLocal, player.x, player.y);
});

socket.on('sync', function(gameServerData){
	game.receiveData(gameServerData);
});


socket.on('removePlayer', function(playerId){
	game.removePlayer(playerId);
});

$(document).ready( function(){

	$('#join').click( function(){
		playerName = $('#player-name').val();
		joinGame(playerName, selectedPlayer, socket);
	});

	$('#player-name').keyup( function(e){
		playerName = $('#player-name').val();
		var k = e.keyCode || e.which;
		if(k == 13){
			joinGame(playerName, selectedPlayer, socket);
		}
	});

	$('#colorPickerId').click( function(){
		$('#colorPickerId').removeClass('selected')
		$(this).addClass('selected');
		selectedPlayer = $(this).data('player');
	});

});

$(window).on('beforeunload', function(){
	socket.emit('leaveGame', playerName);
});

function joinGame(playerName, playerType, socket){
	if(playerName != ''){
		$('#prompt').hide();
		socket.emit('joinGame', {id: playerName, type: playerType});
		toggleOverlay();
	}
}