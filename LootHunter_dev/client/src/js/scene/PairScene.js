import { CST } from "../CST.js";
import Phaser from "phaser";
import EventDispatcher from "../util/EventDispatcher";
import Collectibles from "../util/Collectibles";

var displayPairId;
var displayInput;
var displayOpponent;
var parseInput;
var playerIndex;
var mode;
var account;
var opponentAccount;

var thisX = 94;
var thisY = 94;
var itemList = [];

var itemGroup;
var itemMenu;

class PairScene extends Phaser.Scene {
    constructor() {
        super({
            key: CST.SCENES.PAIR
        })

        this.emitter = EventDispatcher.getInstance();
        this.setEventListeners();
    }

    init(data) {
        console.log("@Pair Scene");
        mode = data.mode;
        account = data.account;
    }

    preload() {

    }

    create() {
        this.emitter.emit("userConnect", account);

        itemGroup = this.add.group();
        itemMenu = this.add.group();

        this.input.on('pointerdown', () => {
            this.handleClick();
        });

        let createButton = this.add.text(this.game.renderer.width / 4, this.game.renderer.height / 4, "CREATE ROOM", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0.5).setDepth(1);
        createButton.setInteractive();
        createButton.on("pointerover", () => {
            createButton.setStyle({ fill: "orange", fontSize: 30 });
        })
        createButton.on("pointerout", () => {
            createButton.setStyle({ fill: "white", fontSize: 30 });
        })
        createButton.on("pointerup", () => {
            let pairNumber = Phaser.Math.Between(10000, 99999);
            console.log("Emit pair Id [" + `${pairNumber}` + "]");
            this.emitter.emit("createPairId", pairNumber);
            playerIndex = 1;
        })

        this.add.text(this.game.renderer.width / 4 * 3, this.game.renderer.height / 4, "Enter pairing number to join a room.", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 24
        }).setOrigin(0.5).setDepth(1);

        // Pairing Id input
        let inputNumber = "";

        this.input.keyboard.on('keydown_NUMPAD_ZERO', function () {
            inputNumber += "0";
            this.showInput(inputNumber);
        }, this);
        this.input.keyboard.on('keydown_NUMPAD_ONE', function () {
            inputNumber += "1";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_TWO', function () {
            inputNumber += "2";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_THREE', function () {
            inputNumber += "3";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_FOUR', function () {
            inputNumber += "4";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_FIVE', function () {
            inputNumber += "5";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_SIX', function () {
            inputNumber += "6";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_SEVEN', function () {
            inputNumber += "7";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_EIGHT', function () {
            inputNumber += "8";
            this.showInput(inputNumber);
        }, this);

        this.input.keyboard.on('keydown_NUMPAD_NINE', function () {
            inputNumber += "9";
            this.showInput(inputNumber);
        }, this);

        let joinButton = this.add.text(this.game.renderer.width / 3 * 1.5, this.game.renderer.height / 4 + 100, "JOIN ROOM", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0, 0.5).setDepth(1);
        joinButton.setInteractive();
        joinButton.on("pointerover", () => {
            joinButton.setStyle({ fill: "orange", fontSize: 30 });
        })
        joinButton.on("pointerout", () => {
            joinButton.setStyle({ fill: "white", fontSize: 30 });
        })
        joinButton.on("pointerup", () => {
            this.emitter.emit('joinRoom', parseInput);
            playerIndex = 2;
        })

        let clearButton = this.add.text(this.game.renderer.width / 5 * 4, this.game.renderer.height / 4 + 100, "CLEAR", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0, 0.5).setDepth(1);
        clearButton.setInteractive();
        clearButton.on("pointerover", () => {
            clearButton.setStyle({ fill: "orange", fontSize: 30 });
        })
        clearButton.on("pointerout", () => {
            clearButton.setStyle({ fill: "white", fontSize: 30 });
        })
        clearButton.on("pointerup", () => {
            inputNumber = "";
            this.showInput(inputNumber);
        })

        displayOpponent = this.add.text(50, this.game.renderer.height / 4 * 2 + 50, "Player 2 ID (Opponent): ", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0).setDepth(1);

    }

    showInput(inputNumber) {
        if (displayInput) {
            displayInput.destroy();
        }
        displayInput = this.add.text(this.game.renderer.width / 4 * 3, this.game.renderer.height / 4 + 50, `${inputNumber}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0.5).setDepth(1);
        parseInput = parseInt(inputNumber);
    }

    setEventListeners() {
        this.emitter.on("showPlayerId", this.showPlayerId.bind(this));
        this.emitter.on("updatePairId", this.updatePairId.bind(this));
        this.emitter.on("updateOpponent", this.updateOpponent.bind(this));
        this.emitter.on("createInventory", this.createInventory.bind(this));
        this.emitter.on("toInventory", this.toInventory.bind(this));
    }

    showPlayerId(id) {
        this.add.text(50, this.game.renderer.height / 4 * 2, "Player 1 ID (Yourself): " + id, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0).setDepth(1);
    }

    updatePairId(pairId) {
        if (displayPairId) {
            displayPairId.destroy();
        }
        console.log("Update [updatePairId]");
        displayPairId = this.add.text(this.game.renderer.width / 4, this.game.renderer.height / 4 + 50, "Pairing number: " + `${pairId}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5).setDepth(1);
    }

    updateOpponent(opponentId) {
        if (displayOpponent) {
            displayOpponent.destroy();
        }
        opponentAccount = opponentId;
        displayOpponent = this.add.text(50, this.game.renderer.height / 4 * 2 + 50, "Player 2 ID (Opponent): " + opponentId, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0).setDepth(1);

        let tradeButton = this.add.text(this.game.renderer.width / 3, this.game.renderer.height - 50, "TRADE", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0.5).setDepth(1);
        tradeButton.setInteractive();
        tradeButton.on("pointerover", () => {
            tradeButton.setStyle({ fill: "orange", fontSize: 30 });
        })
        tradeButton.on("pointerout", () => {
            tradeButton.setStyle({ fill: "white", fontSize: 30 });
        })
        tradeButton.on("pointerup", () => {
            this.emitter.emit("getCollectibles", "Trade");
            this.createItemBackground();
        })

        if (playerIndex == 1) {
            let startButton = this.add.text(this.game.renderer.width / 3 * 2, this.game.renderer.height - 50, "START", {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 30
            }).setOrigin(0.5).setDepth(1);
            startButton.setInteractive();
            startButton.on("pointerover", () => {
                startButton.setStyle({ fill: "orange", fontSize: 30 });
            })
            startButton.on("pointerout", () => {
                startButton.setStyle({ fill: "white", fontSize: 30 });
            })
            startButton.on("pointerup", () => {
                this.emitter.emit("startPreparation");
            })
        }
    }

    createInventory(type, rareness, attribute, level, id) {
        let _id = parseInt(id);
        let _name;
        let _type;
        let _icon;
        let _rareness;
        let _attribute = parseInt(attribute);
        let _level = parseInt(level);
        switch (type) {
            case "0":
                _name = "Sword";
                _type = "Sword";
                _icon = CST.SPRITE.SWORD;
                break;
            case "1":
                _name = "Bow";
                _type = "Bow";
                _icon = CST.IMAGE.BOW;
                break;
            case "2":
                _name = "Armor";
                _type = "Armor";
                _icon = CST.IMAGE.ARMOR;
                break;
        }
        let frame;
        switch (rareness) {
            case "0":
                _rareness = "Normal";
                frame = 0;
                break;
            case "1":
                _rareness = "Rare";
                frame = 1;
                break;
            case "2":
                _rareness = "Epic";
                frame = 2;
                break;
            case "3":
                _rareness = "Mythic";
                frame = 3;
                break;
        }

        let item = new Collectibles(this, thisX, thisY, _icon, frame).setScale(2).setOrigin(0.5).setDepth(2);
        item.receiveItemData(parseInt(_id), _name, _type, _rareness, _attribute, _level);
        item.setInteractive();
        item.on("pointerup", () => {
            // selectedItem = item;
            this.showActionMenu(item);
        });
        if (thisX == 584) {
            thisX = 94;
            thisY = thisY + 70;
        } else {
            thisX = thisX + 70;
        }
        itemGroup.add(item);
        itemList.push(_id);
    }

    toInventory() {
        this.scene.start(CST.SCENES.INVENTORY, { index: playerIndex, mode: mode });
    }

    // Local functions
    createItemBackground() {
        // Create inventory box
        let itemBox = this.add.graphics().setDepth(2);
        itemBox.lineStyle(3, 0xffffff, 1);
        itemBox.strokeRect(60, 20, 560, 600);
        itemBox.fillStyle(0x000000, 1);
        itemBox.fillRect(60, 20, 560, 600);
        itemGroup.add(itemBox);

        let itemTitle = this.add.text(340, 40, "INVENTORY", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0.5).setDepth(2);
        itemGroup.add(itemTitle);

        let closeButton = this.add.text(340, this.game.renderer.height - 50, "CLOSE", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5).setDepth(2);
        itemGroup.add(closeButton);
        closeButton.setInteractive();
        closeButton.on("pointerover", () => {
            closeButton.setStyle({ fill: "green" });
        });
        closeButton.on("pointerout", () => {
            closeButton.setStyle({ fill: "white" });
        });
        closeButton.on("pointerup", () => {
            thisX = 94;
            thisY = 94;
            this.clearGroup(itemMenu);
            this.clearGroup(itemGroup);
        });
    }
    // Show details and available action of the item
    showActionMenu(item) {
        // Make sure no multiple menu on the screen
        if (itemMenu.getChildren() != 0) {
            this.clearGroup(itemMenu);
        }

        // Create user interface on right hand side
        let itemPanel = this.add.graphics().setDepth(2);
        itemPanel.lineStyle(3, 0xffffff, 1);
        itemPanel.strokeRect(630, 195, 165, 190);
        itemPanel.fillStyle(0x000000, 1);
        itemPanel.fillRect(630, 195, 165, 190);
        itemMenu.add(itemPanel);

        let itemType = this.add.text(635, 200, "Type:\n" + `${item.getType()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0).setDepth(2);
        itemMenu.add(itemType);

        let itemRareness = this.add.text(635, 250, "Rareness: " + `${item.getRareness()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0).setDepth(2);
        itemMenu.add(itemRareness);

        let itemLevel = this.add.text(635, 280, "Level: " + `${item.getItemLevel()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0).setDepth(2);
        itemMenu.add(itemLevel);

        let itemAttribute = this.add.text(635, 310, "Attribute: " + `${item.getAttribute()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0).setDepth(2);
        itemMenu.add(itemAttribute);

        let SendButton = this.add.text(635, 350, "Send to opponent", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0).setDepth(2);
        itemMenu.add(SendButton);
        SendButton.setInteractive();
        SendButton.on("pointerover", () => {
            SendButton.setStyle({ fill: "green" });
        });
        SendButton.on("pointerout", () => {
            SendButton.setStyle({ fill: "white" });
        });
        SendButton.on("pointerup", () => {
            this.emitter.emit("transferOwnership", account, opponentAccount, item.getID());
        });

    }

    handleClick() {
        this.sound.play(CST.AUDIO.CLICK);
    }

    // Clear and destory members in the group
    clearGroup(groupSprite) {
        groupSprite.clear(true, true);
    }

}

export default PairScene;