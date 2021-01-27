import { CST } from "../CST";
import Phaser from "phaser";
import EventDispatcher from "../util/EventDispatcher";

var account;

class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: CST.SCENES.MENU
        })

        this.emitter = EventDispatcher.getInstance();
        this.setEventListeners();
    }
    init() {
        console.log("@Main Scene");
    }
    create() {

        this.input.on('pointerdown', () => {
            this.handleClick();
        });

        // Add handover sprite
        let hoverSprite = this.add.sprite(100, 100, CST.SPRITE.SKELETON);
        // Add sprite animation
        this.anims.create({
            key: "walk",
            frameRate: 3,
            repeat: -1, //forever
            frames: this.anims.generateFrameNumbers(CST.SPRITE.SKELETON, {
                frames: [0, 1, 2]
            })
        })
        hoverSprite.play("walk");
        hoverSprite.setVisible(false);

        // Add title and buttons (use setDepth to seperate the layer)
        this.add.text(this.game.renderer.width / 2, this.game.renderer.height * 0.2, "LOOT HUNTER", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 100
        }).setDepth(1).setOrigin(0.5);

        /*
            PointerEvents:
                pointerover - hovering
                pointerout - not hovering
                pointerup - click and release
                pointerdown - just click
        */

        let singlePlayButton = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2, "SINGLE PLAYER", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 50
        }).setDepth(1).setOrigin(0.5);
        this.sceneInteraction(singlePlayButton, hoverSprite, CST.SCENES.INVENTORY, "New");

        let multiPlayButton = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2 + 50, "MULTIPLAYER", {
            fill: "white",
            fontFamily:CST.FONT.GEORGIA,
            fontSize: 50
        }).setDepth(1).setOrigin(0.5);
        this.sceneInteraction(multiPlayButton, hoverSprite, CST.SCENES.PAIR, "Multi");

        let rewindButton = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2 + 100, "REWIND", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 50
        }).setDepth(1).setOrigin(0.5);
        this.sceneInteraction(rewindButton, hoverSprite, CST.SCENES.REWIND, "Rewind");

        let testButton = this.add.text(this.game.renderer.width, this.game.renderer.height, "Create", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setDepth(1).setOrigin(1);
        testButton.setInteractive();
        testButton.on("pointerover", () => {
            testButton.setStyle({ fill: "orange" });
        });
        testButton.on("pointerout", () => {
            testButton.setStyle({ fill: "white" });
        });
        testButton.on("pointerup", () => {
            this.getTestCollectibles();
        });

        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.emitter.emit("getUserAccount");
            }
        });
    }

    handleClick() {
        this.sound.play(CST.AUDIO.CLICK);
    }

    // Interaction for each menu button
    sceneInteraction(button, sprite, scene, mode) {
        button.setInteractive();
        button.on("pointerover", () => {
            sprite.setVisible(true);
            sprite.x = button.x - (button.width / 2) - 20;
            sprite.y = button.y;
            button.setStyle({ fill: "orange" });
        });
        button.on("pointerout", () => {
            sprite.setVisible(false);
            button.setStyle({ fill: "white" });
        });
        button.on("pointerup", () => {
            this.scene.start(scene, {account: account, mode: mode});
        });
    }

    setEventListeners() {
        this.emitter.on("showUserAccount", this.showUserAccount.bind(this));
    }

    // Get player's ethereum address and display on the front-end
    showUserAccount(userAccount) {
        account = userAccount;
        this.add.text(0, 0, "User Account: " + account, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setDepth(1).setOrigin(0);
    }

    // Get test sample collectibles
    getTestCollectibles() {
        console.log("Emit sample request");
        this.emitter.emit("getSample");
    }
}

export default MenuScene;