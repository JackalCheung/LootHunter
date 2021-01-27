const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server);

let interval;

var players = {};
var playersList = [];
var hostList = [];

io.on("connection", (socket) => {
  console.log("A player connected");
  socket.on('createPlayer', (etherAccount) => {
    players[socket.id] = {
      playerId: socket.id,
      playerEtherId: etherAccount,
      pairId: 0,
      readyStatus: false
    };
    playersList.push(socket.id);
    socket.emit('createPlayer', players[socket.id].playerEtherId);
  })

  // Pairing Events
  socket.on('createPairId', (pairId) => {
    if (players[socket.id].pairId != 0) {
      hostList.pop(socket.id)
    }
    players[socket.id].pairId = pairId;
    hostList.push(socket.id);
    socket.join(pairId);
    socket.emit('updatePairId', pairId, players[socket.id].pairId);
  })

  socket.on('joinRoom', (pairId) => {
    let hostId;
    if (players[socket.id].pairId != 0) {

    }
    players[socket.id].pairId = pairId;
    for (let i = 0; i < playersList.length; i++) {
      if (players[playersList[i]].pairId == pairId && players[playersList[i]].playerId != socket.id) {
        hostId = players[playersList[i]].playerEtherId;
        console.log("Hello");
        socket.join(pairId, () => {
          socket.emit('enterRoom', hostId);
          socket.to(pairId).emit('joinRoom', pairId, players[socket.id].playerEtherId);
        });
      }
    }
  });

  // Scene Change Events
  socket.on('startPreparation', () => {
    for (let i = 0; i < hostList.length; i++) {
      if (hostList[i] == socket.id) {
        socket.emit('toInventory');
        socket.to(players[socket.id].pairId).emit('toInventory');
      }
    }
    players[socket.id].pairId
  });

  socket.on('playerReady', (readyStatus) => {
    let playerInRoom = [];
    players[socket.id].readyStatus = readyStatus;
    for (let i = 0; i < playersList.length; i++) {
      if (players[playersList[i]].pairId == players[socket.id].pairId && players[playersList[i]].playerId != socket.id) {
        playerInRoom.push(players[playersList[i]].readyStatus);
        socket.to(players[playersList[i]].pairId).emit('opponentReady', readyStatus);
      }
    }
    // io.sockets.in(room).emit();
    if(playerInRoom.every(Boolean)) {
      socket.emit('toMultiplay');
      socket.in(players[socket.id].pairId).emit('toMultiplay');
    }
  })

  // In-game Events
  socket.on('transferChessData', (playerIndex, dataSet) => {
    console.log("Transfer data to opponent");
    socket.to(players[socket.id].pairId).emit('createEnemyChess', playerIndex, dataSet);
  })

  socket.on('updateMove', (chessId, x, y) => {
    socket.to(players[socket.id].pairId).emit('updateEnemyPosition', chessId, x, y);
  })

  socket.on('updateAttack', (chessId, targetId) => {
    socket.to(players[socket.id].pairId).emit('updateEnemyAttack', chessId, targetId);
  })

  socket.on('nextTurn', (playerIndex) => {
    socket.emit('roundControl', playerIndex);
    socket.to(players[socket.id].pairId).emit('roundControl', playerIndex);
  })

  socket.on('playerLose', (playerIndex) => {
    socket.emit('announceResult', playerIndex);
    socket.to(players[socket.id].pairId).emit('announceResult', playerIndex);
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    playersList.pop(socket.id);
    socket.to(players[socket.id].pairId).emit('playerLeave');
    socket.leave(players[socket.id].pairId);
    clearInterval(interval);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));