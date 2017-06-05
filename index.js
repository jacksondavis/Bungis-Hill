// Import express module
var express = require('express');  
var app = express(); 

// Import the 'path' module (packaged with Node.js)
var path = require('path');

// Serve static html, js, css, etc. in the public directory
app.use(express.static(path.join(__dirname,'public')));

// Run server on port 8082
var server = app.listen(8080, function () {  
    var port = server.address().port;
    console.log('Server running at port %s', port);
});

// Import socket.io module
var io = require('socket.io')(server);  

var people = {};

function GameServer() {
    this.players = [];
}

GameServer.prototype = {

    addPlayer: function(player){
        this.players.push(player);
    },

    removePlayer: function(playerId){
        // Remove player object
        this.players = this.players.filter(function(p) {return p.id != playerId});
    },

    // Sync player with new data received from a client
    syncPlayer: function(newPlayerData){
        this.players.forEach( function(player){
            if(player.id == newPlayerData.id){
                player.x = newPlayerData.x;
                player.y = newPlayerData.y;
            }
        });
    },

    getData: function(){
        var gameData = {};
        gameData.players = this.players;

        return gameData;
    }
}

var game = new GameServer();

// Socket.io events
io.on('connection', function(client) {  
    console.log('User connected');

    client.on('joinGame', function(player) {
        console.log(player.id + ' joined the game');
        people[client.id] = player.id
        var initX = getRandomInt(40, 900);
        var initY = getRandomInt(40, 500);
        client.emit('addPlayer', { id: player.id, type: player.type, isLocal: true, x: initX, y: initY });
        client.broadcast.emit('addPlayer', { id: player.id, type: player.type, isLocal: false, x: initX, y: initY} );

        game.addPlayer({ id: player.id, type: player.type});
    });

    client.on('sync', function(data){
        //Receive data from clients
        if(data.player != undefined){
            game.syncPlayer(data.player);
        }
        
        //Broadcast data to clients
        client.emit('sync', game.getData());
        client.broadcast.emit('sync', game.getData());
    });

    client.on('leaveGame', function(playerId){
        console.log(playerId + ' has left the game');
        game.removePlayer(playerId);
        client.broadcast.emit('removePlayer', playerId);
    });

    client.on('chat message', function(msg){
        var name = "";
        if (people[client.id] == undefined) {
            name = 'Guest';
        }
        else {
            name = people[client.id];
        }
        if (msg != '') {
            console.log(name + ': ' + msg);
        }
    });

    client.on('chat message', function(msg){
        var name = "";
        if (people[client.id] == undefined) {
            name = 'Guest';
        }
        else {
            name = people[client.id];
        }
        if (msg != '') {
            io.emit('chat message', name + ': ' + msg);
        }
    });
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}