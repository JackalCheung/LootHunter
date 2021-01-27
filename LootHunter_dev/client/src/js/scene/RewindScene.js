import { CST } from "../CST";
import Phaser from "phaser";
import EventDispatcher from "../util/EventDispatcher";

var account;
var mode;
var matchIndex;
var roundIndex;
var chosenMatch;
var chosenRound;
var displayMatchNum;
var displayRoundNum;
var displayMaxRound;

class RewindScene extends Phaser.Scene {
    constructor() {
        super({
            key: CST.SCENES.REWIND
        })

        this.emitter = EventDispatcher.getInstance();
        this.setEventListeners();
    }

    init(data) {
        console.log("@Rewind Scene");
        account = data.account;
        mode = data.mode;
    }

    create() {
        this.input.on('pointerdown', () => {
            this.handleClick();
        });

        let fallbackButton = this.add.text(0, 0, "BACK", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0);
        this.sceneInteraction(fallbackButton, CST.SCENES.MENU);

        this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 7, "REWIND MATCH", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 40
        }).setOrigin(0.5, 0);

        this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 4, "User Account: " + account, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 25
        }).setOrigin(0.5, 0);

        this.add.text(this.game.renderer.width / 2 - 100, this.game.renderer.height / 2, "Rewind To Match:", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 25
        }).setOrigin(1, 0.5);

        this.add.text(this.game.renderer.width / 2 - 100, this.game.renderer.height / 2 + 150, "Rewind To Round:", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 25
        }).setOrigin(1, 0.5);

        chosenMatch = 0;
        displayMatchNum = this.add.text(this.game.renderer.width / 2 + 30, this.game.renderer.height / 2, `${chosenMatch}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 25
        }).setOrigin(1, 0.5);
        let next1_Button = this.add.text(this.game.renderer.width / 2 + 100, this.game.renderer.height / 2, "+", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 60
        }).setOrigin(0.5);
        let pre1_Button = this.add.text(this.game.renderer.width / 2 - 50, this.game.renderer.height / 2, "-", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 60
        }).setOrigin(0.5);
        this.setButton(next1_Button, "Match", "add");
        this.setButton(pre1_Button, "Match", "subtract");

        chosenRound = 0;
        displayRoundNum = this.add.text(this.game.renderer.width / 2 + 30, this.game.renderer.height / 2 + 150, `${chosenRound}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 25
        }).setOrigin(1, 0.5);
        let next2_Button = this.add.text(this.game.renderer.width / 2 + 100, this.game.renderer.height / 2 + 150, "+", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 60
        }).setOrigin(0.5);
        let pre2_Button = this.add.text(this.game.renderer.width / 2 - 50, this.game.renderer.height / 2 + 150, "-", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 60
        }).setOrigin(0.5);
        this.setButton(next2_Button, "Round", "add");
        this.setButton(pre2_Button, "Round", "subtract");

        let goButton = this.add.text(this.game.renderer.width / 2, this.game.renderer.height, "GO", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 40
        }).setOrigin(0.5, 1);
        this.sceneInteraction(goButton, CST.SCENES.SPLAY);

        this.emitter.emit("getMatchIndex", "Rewind");
    }

    sceneInteraction(button, scene) {
        button.setInteractive();
        button.on("pointerover", () => {
            button.setStyle({ fill: "orange" });
        });
        button.on("pointerout", () => {
            button.setStyle({ fill: "white" });
        });
        button.on("pointerup", () => {
            if (scene == CST.SCENES.MENU)
                this.scene.start(scene);
            else if (scene == CST.SCENES.SPLAY)
                this.scene.start(scene, { mode: mode, matchIndex: chosenMatch, roundIndex: chosenRound })
        });
    }

    setEventListeners() {
        this.emitter.on("showMatchIndex", this.showMatchIndex.bind(this));
        this.emitter.on("showRoundIndex", this.showRoundIndex.bind(this));
    }

    showMatchIndex(_index) {
        matchIndex = _index;
        this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 3, "Match Played: " + matchIndex, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0.5, 0);
    }

    showRoundIndex(_index, result) {
        if (displayMaxRound) {
            displayMaxRound.destroy();
        }
        roundIndex = _index;
        if (result == "Not Finished" || result == "Lose") {
            mode = "Rewind(New)";
        } else if (result == "Win") {
            mode = "Rewind";
        }
        displayMaxRound = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2 + 50, "Round Played: " + roundIndex + "  Result: " + result, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0.5, 0);
    }

    setButton(button, forNumber, func) {
        button.setInteractive();
        button.on("pointerover", () => {
            button.setStyle({ fill: "orange" });
        })
        button.on("pointerout", () => {
            button.setStyle({ fill: "white" });
        })
        switch (forNumber) {
            case "Match":
                this.changeChosenMatchIndex(button, func);
                break;
            case "Round":
                this.changeChosenRoundIndex(button, func);
                break;
        }
    }

    changeChosenMatchIndex(button, func) {
        button.on("pointerup", () => {
            if (displayMatchNum) {
                displayMatchNum.destroy();
            }
            if (func == "add" && chosenMatch < matchIndex) {
                chosenMatch += 1;
            } else if (func == "subtract" && chosenMatch > 1) {
                chosenMatch -= 1;
            }
            displayMatchNum = this.add.text(this.game.renderer.width / 2 + 30, this.game.renderer.height / 2, `${chosenMatch}`, {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 25
            }).setOrigin(1, 0.5);
            this.emitter.emit("getRoundIndex", chosenMatch);
        })
    }

    changeChosenRoundIndex(button, func) {
        button.on("pointerup", () => {
            if (displayRoundNum) {
                displayRoundNum.destroy();
            }
            if (func == "add" && chosenRound < roundIndex) {
                chosenRound += 1;
            } else if (func == "subtract" && chosenRound > 1) {
                chosenRound -= 1;
            }
            displayRoundNum = this.add.text(this.game.renderer.width / 2 + 30, this.game.renderer.height / 2 + 150, `${chosenRound}`, {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 25
            }).setOrigin(1, 0.5);
        })
    }

    handleClick() {
        this.sound.play(CST.AUDIO.CLICK);
    }
}

export default RewindScene;