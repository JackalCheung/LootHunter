import React, { useState, useEffect } from 'react';
import webSocket from "socket.io-client";
import EventDispatcher from "./js/util/EventDispatcher";
const ENDPOINT = "http://127.0.0.1:4001";

var etherAccount = "";

const Socket = () => {
    const [ws, setWs] = useState(null)
    const emitter = EventDispatcher.getInstance();
    const dispatcherInit = () => {
        emitter.on("userConnect", connectWebSocket);
    }

    const connectWebSocket = (account) => {
        etherAccount = account;
        setWs(webSocket(ENDPOINT))
    }

    useEffect(() => {
        if (ws) {
            console.log('success connect!')
            initWebSocket();
            createPlayerInfo();
            setEventListeners();
        }
    }, [ws])

    const setEventListeners = () => {
            // Pair Scene Events
            emitter.on("createPairId", createPlayerPairId);
            emitter.on("joinRoom", joinRoom);

            // Scene Change Events
            emitter.on("startPreparation", startPreparation);
            emitter.on("playerReady", playerReady);

            // In-game Events
            emitter.on("transferChessData", transferChessData);
            emitter.on("updateMove", updateMove);
            emitter.on("updateAttack", updateAttack);
            emitter.on("nextTurn", nextTurn);
            emitter.on("playerLose", playerLose);
            emitter.on("disconnect", disconnect);
    }

    const createPlayerPairId = (pairId) => {
        ws.emit("createPairId", pairId);
    }

    const joinRoom = (pairId) => {
        ws.emit("joinRoom", pairId);
    }

    const startPreparation = () => {
        ws.emit("startPreparation");
    }

    const playerReady = (readyStatus) => {
        ws.emit("playerReady", readyStatus);
    }

    const transferChessData = (playerIndex, dataSet) => {
        ws.emit("transferChessData", playerIndex, dataSet);
    }

    const updateMove = (chessId, x, y) => {
        ws.emit("updateMove", chessId, x, y);
    }

    const updateAttack = (chessId, targetId) => {
        ws.emit("updateAttack", chessId, targetId);
    }

    const nextTurn = (playerIndex) => {
        ws.emit("nextTurn", playerIndex);
    }

    const playerLose = (playerIndex) => {
        ws.emit("playerLose", playerIndex);
    }

    const disconnect = () => {
        ws.close();
    }

    const createPlayerInfo = () => {
        ws.emit("createPlayer", etherAccount);
    }

    const initWebSocket = () => {
        // Pair Scene Events
        ws.on('createPlayer', (id) => {
            console.log(id);
            emitter.emit("showPlayerId", id);
        })
        ws.on('updatePairId', (pairId) => {
            console.log(pairId);
            emitter.emit("updatePairId", pairId);
        })
        ws.on('joinRoom', (pairId, id) => {
            console.log("Player " + id + " joined Room " + pairId);
            emitter.emit("updateOpponent", id);
        })
        ws.on('enterRoom', (hostId) => {
            console.log("Player " + hostId + " is the host");
            emitter.emit("updateOpponent", hostId);
        })
        ws.on('toInventory', () => {
            console.log("Start Preparation");
            emitter.emit("toInventory");
        })
        ws.on('playerLeave', () => {
            emitter.emit("playerLeave");
        })

        // Inventory Events
        ws.on('opponentReady', (readyStatus) => {
            if (readyStatus) {
                console.log("Your opponent is ready.");
            } else {
                console.log("Your opponent is not ready.");
            }
            emitter.emit("opponentReady", readyStatus);
        })
        ws.on('toMultiplay', () => {
            console.log("Start Multiplay");
            emitter.emit("toMultiplay");
        })

        // In-game Events
        ws.on('createEnemyChess', (enemyPlayerIndex, dataSet) => {
            emitter.emit("createEnemyChess", enemyPlayerIndex, dataSet);
        })
        ws.on('updateEnemyPosition', (chessId, x, y) => {
            emitter.emit("updateEnemyPosition", chessId, x, y);
        })
        ws.on('updateEnemyAttack', (chessId, targetId) => {
            emitter.emit("updateEnemyAttack", chessId, targetId);
        })
        ws.on('roundControl', (enemyPlayerIndex) => {
            emitter.emit("roundControl", enemyPlayerIndex);
        })
        ws.on('announceResult', (enemyPlayerIndex) => {
            emitter.emit("announceResult", enemyPlayerIndex);
        })
    }

    dispatcherInit();

    return (
        <div>
        </div>
    )
}

export default Socket;