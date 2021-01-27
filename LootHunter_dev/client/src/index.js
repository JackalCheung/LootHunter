import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Socket from './socket'

// Import game engine for front-end
import Phaser from "phaser";
import LoadScene from "./js/scene/LoadScene";
import MenuScene from "./js/scene/MenuScene";
import InventoryScene from "./js/scene/InventoryScene";
import SinglePlayScene from "./js/scene/SinglePlayScene";
import RewindScene from "./js/scene/RewindScene";
import PairScene from "./js/scene/PairScene";
import MultiScene from "./js/scene/MultiScene";

// Import socket for multiplayer
/*
import socketInit from "./server";
socketInit();
*/

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 640,
    scene: [
        LoadScene, MenuScene, InventoryScene, SinglePlayScene, RewindScene, PairScene, MultiScene
    ],
    render: {
        pixelArt: true
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

var game = new Phaser.Game(config);

ReactDOM.render(<App />, document.getElementById('root'));
ReactDOM.render(<Socket />, document.getElementById('socket'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
