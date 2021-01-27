import { CST } from "../CST";
import Phaser from "phaser";
import EventDispatcher from "../util/EventDispatcher";
import CharacterSprite from "../util/CharacterSprite";
import Collectibles from "../util/Collectibles";

var itemMenu;
var playerChessGroup;
var detailGroup;
var itemGroup;
var selectedItem;
var thisX;
var thisY;
var equipID;

var mode;
// For multiplayer
var playerIndex;
var readyStatus

class InventoryScene extends Phaser.Scene {
    constructor() {
        super({
            key: CST.SCENES.INVENTORY
        })

        this.emitter = EventDispatcher.getInstance();
        this.setEventListeners();
    }

    init(data) {
        console.log("@Inventory Scene");
        mode = data.mode;
        console.log("Mode: " + mode);
        if (mode == "Multi") {
            playerIndex = data.index;
            readyStatus = false;
            this.emitter.on("opponentReady", this.opponentReady.bind(this));
            this.emitter.on("toMultiplay", this.toMultiplay.bind(this));
        }

    }

    preload() {

    }

    create() {
        // Set basic pointer input sound and scene fallback button
        this.input.on('pointerdown', () => {
            this.handleClick();
        });

        equipID = [];
        if (mode != "Multi") {
            let fallbackButton = this.add.text(0, 0, "BACK", {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 20
            }).setOrigin(0);
            fallbackButton.setInteractive();
            fallbackButton.on("pointerover", () => {
                fallbackButton.setStyle({ fill: "orange" });
            });
            fallbackButton.on("pointerout", () => {
                fallbackButton.setStyle({ fill: "white" });
            });
            fallbackButton.on("pointerup", () => {
                this.emitter.emit("disconnect");
                this.scene.start(CST.SCENES.MENU);
            });
        }

        // Create scene title
        this.add.text(this.game.renderer.width / 2, 0, "PREPARATION STAGE", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 40
        }).setOrigin(0.5, 0);

        // Create tutorial button
        var tutorialMenu = this.add.group();
        let tutorialButton = this.add.text(this.game.renderer.width - 60, 10, "TUTORIAL", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0.5, 0);
        tutorialButton.setInteractive();
        tutorialButton.on("pointerover", () => {
            tutorialButton.setStyle({ fill: "orange" });
        })
        tutorialButton.on("pointerout", () => {
            tutorialButton.setStyle({ fill: "white" });
        })
        tutorialButton.on("pointerup", () => {
            this.showTutorial(tutorialMenu);
        })

        // Create player's characters for equipping collectibles
        playerChessGroup = this.add.group();
        var playerChessStatus = [];
        for (let i = 0; i < 5; i++) {
            let characterBox = this.add.graphics();
            characterBox.lineStyle(3, 0xffffff, 1);
            characterBox.strokeRect(16 + 128 * i, 47, 96, 96);
            this.add.text(64 + 128 * i, 160, "CHESS " + (i + 1), {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 18
            }).setOrigin(0.5);
            let itemBox1 = this.add.graphics();
            itemBox1.lineStyle(3, 0xffffff, 1);
            itemBox1.strokeRect(32 + 128 * i, 180, 64, 64);
            this.add.text(64 + 128 * i, 212, "WEAPON", {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 14
            }).setOrigin(0.5);
            let itemBox2 = this.add.graphics();
            itemBox2.lineStyle(3, 0xffffff, 1);
            itemBox2.strokeRect(32 + 128 * i, 250, 64, 64);
            this.add.text(64 + 128 * i, 282, "ARMOR", {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 14
            }).setOrigin(0.5);
            let playerChess = new CharacterSprite(this, 64 + 128 * i, 93, CST.SPRITE.HUMAN, 1, 1, i).setOrigin(0.5).setScale(3);
            playerChess.setInteractive();
            playerChessStatus[i] = false;
            playerChessGroup.add(playerChess);
        }

        detailGroup = this.add.group();
        this.input.on("gameobjectdown", (pointer, gameObject) => {

            let chess_check = playerChessGroup.getChildren();

            for (let i = 0; i < playerChessGroup.getLength(); i++) {
                if (gameObject == chess_check[i]) {
                    // Store selected object 
                    let selectedChess = chess_check[i];
                    this.showChessDetail(detailGroup, selectedChess);
                }
            }
        });

        // Create inventory section title and area
        this.add.text(320, 320, "INVENTORY", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 40
        }).setOrigin(0.5, 0);
        let inventoryArea = this.add.graphics();
        inventoryArea.lineStyle(3, 0xffffff, 1);
        inventoryArea.strokeRect(16, 370, 608, 200);

        // Create inventory according to items owned in player's address
        this.emitter.emit("getCollectibles", "Preparation");
        itemGroup = this.add.group();

        // Create user interface on right hand side
        let itemPanel = this.add.graphics();
        itemPanel.lineStyle(3, 0xffffff, 1);
        itemPanel.strokeRect(this.game.renderer.width - 155, 40, 150, 590);

        itemMenu = this.add.group();

        // Create sample item for eqiupment
        thisX = 54;
        thisY = 408;

        if (mode == "New") {
            let sampleItem = new Collectibles(this, thisX, thisY, CST.SPRITE.SWORD, 2).setScale(2).setOrigin(0.5);
            sampleItem.receiveItemData(0, "Wood Sword", "Sword", "Epic", 14, 3)
            sampleItem.setInteractive();
            sampleItem.on("pointerup", () => {
                selectedItem = sampleItem;
                this.showEquipMenu(selectedItem);
            });
            let sampleGroup = this.add.group();
            sampleGroup.add(sampleItem);
        }

        // Create a ready button for player to start the game after preparation
        let readyButton = this.add.text(320, this.game.renderer.height - 40, "READY", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 40
        }).setOrigin(0.5);
        readyButton.setInteractive();
        readyButton.on("pointerover", () => {
            readyButton.setStyle({ fill: "orange" });
        })
        readyButton.on("pointerout", () => {
            if (readyStatus)
                readyButton.setStyle({ fill: "green" });
            else
                readyButton.setStyle({ fill: "white" });
        })
        readyButton.on("pointerup", () => {
            // this.sound.play(CST.AUDIO.START);
            let chess_data = playerChessGroup.getChildren();
            if (mode == "New") {
                this.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        this.scene.start(CST.SCENES.SPLAY, {
                            chess1: [chess_data[0].weaponType, chess_data[0].getAttack(), chess_data[0].getDefense(), chess_data[0].currentItemLevel],
                            chess2: [chess_data[1].weaponType, chess_data[1].getAttack(), chess_data[1].getDefense(), chess_data[1].currentItemLevel],
                            chess3: [chess_data[2].weaponType, chess_data[2].getAttack(), chess_data[2].getDefense(), chess_data[2].currentItemLevel],
                            chess4: [chess_data[3].weaponType, chess_data[3].getAttack(), chess_data[3].getDefense(), chess_data[3].currentItemLevel],
                            chess5: [chess_data[4].weaponType, chess_data[4].getAttack(), chess_data[4].getDefense(), chess_data[4].currentItemLevel],
                            mode: "New",
                            equipID: equipID
                        });
                    },
                })
            } else if (mode == "Multi" && readyStatus == false) {
                readyButton.setStyle({ fill: "green" });
                readyStatus = true;
                this.emitter.emit("playerReady", readyStatus);
            } else if (mode == "Multi" && readyStatus == true) {
                readyButton.setStyle({ fill: "white" });
                readyStatus = false;
                this.emitter.emit("playerReady", readyStatus);
            }
        })
    }

    showEquipMenu(item) {
        if (itemMenu.getChildren() != 0) {
            this.clearGroup(itemMenu);
        }

        let itemType = this.add.text(this.game.renderer.width - 150, 300, "Type:\n" + `${item.getType()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0);
        itemMenu.add(itemType);

        let itemRareness = this.add.text(this.game.renderer.width - 150, 350, "Rareness: \n" + `${item.getRareness()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0);
        itemMenu.add(itemRareness);

        let itemLevel = this.add.text(this.game.renderer.width - 150, 400, "Level: " + `${item.getItemLevel()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0);
        itemMenu.add(itemLevel);

        let itemAttribute = this.add.text(this.game.renderer.width - 150, 430, "Attribute: " + `${item.getAttribute()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0);
        itemMenu.add(itemAttribute);

        let equiptext = this.add.text(this.game.renderer.width - 80, 470, "Equip For:", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);
        itemMenu.add(equiptext);

        for (let i = 0; i < 5; i++) {
            let equipButton = this.add.text(this.game.renderer.width - 140 + (30 * i), 500, `${i + 1}`, {
                fill: "white",
                fontFamily: CST.FONT.GEORGIA,
                fontSize: 20
            }).setOrigin(0.5);
            itemMenu.add(equipButton);
            this.setEquipButton(equipButton, item, playerChessGroup, i);
        }

        let unequipButton = this.add.text(this.game.renderer.width - 80, 530, "Unequip", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);
        itemMenu.add(unequipButton);
        unequipButton.setInteractive();
        unequipButton.on("pointerover", () => {
            if (item.getStatus()) {
                unequipButton.setStyle({ fill: "green" });
            } else {
                unequipButton.setStyle({ fill: "red" });
            }
        });
        unequipButton.on("pointerout", () => {
            unequipButton.setStyle({ fill: "white" });
        });
        unequipButton.on("pointerup", () => {
            if (item.getStatus()) {
                item.equippedChess.unequipItem(item.getType(), item.getItemLevel());
                this.showChessDetail(detailGroup, item.equippedChess);
                item.equippedOff();
            }
        });
    }

    setEquipButton(button, item, groupSprite, index) {
        button.setInteractive();
        let group = groupSprite.getChildren();
        let selectedChess = group[index];

        button.on("pointerover", () => {
            if (!item.getStatus() && !selectedChess.equipStatus(item.getType())) {
                button.setStyle({ fill: "green" });
            } else {
                button.setStyle({ fill: "red" });
            }
        });
        button.on("pointerout", () => {
            button.setStyle({ fill: "white" });
        });
        button.on("pointerup", () => {
            if (!item.getStatus() && !selectedChess.equipStatus(item.getType())) {
                selectedChess.equipItem(item.getID(), item.getType(), item.getAttribute(), item.getItemLevel());
                item.equippedOn(selectedChess, selectedChess.x, selectedChess.y + 119);
                this.showChessDetail(detailGroup, selectedChess);
            }
        });
    }

    showChessDetail(groupSprite, sprite) {
        if (groupSprite.getChildren() != 0) {
            // Call the group clearing function if this is still member inside
            this.clearGroup(groupSprite);
        }

        let chessId = this.add.text(this.game.renderer.width - 80, 100, "CHESS " + `${sprite.getIndex()+1}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);
        
        let chessHealth = this.add.text(this.game.renderer.width - 80, 140, "Health: " + `${sprite.getHealth()}` + "/" + `${sprite.getMaxHealth()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);

        let chessAttack = this.add.text(this.game.renderer.width - 80, 180, "Attack: " + `${sprite.getAttack()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);
        let chessDefense = this.add.text(this.game.renderer.width - 80, 220, "Defense: " + `${sprite.getDefense()}`, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);

        // Add the buttons into the detail group for management
        groupSprite.add(chessId);
        groupSprite.add(chessHealth);
        groupSprite.add(chessAttack);
        groupSprite.add(chessDefense);
    }

    handleClick() {
        this.sound.play(CST.AUDIO.CLICK);
    }

    showTutorial(groupSprite) {
        // Make sure no multiple menu on the screen
        if (groupSprite.getChildren() != 0) {
            this.clearGroup(groupSprite);
        }

        // Create tutorial box and title
        let tutorialBox = this.add.graphics();
        tutorialBox.lineStyle(3, 0xffffff, 1);
        tutorialBox.strokeRect(160, 80, 500, 300);
        tutorialBox.fillStyle(0x000000, 1);
        tutorialBox.fillRect(160, 80, 500, 300);

        let tutorialTitle = this.add.text(400, 90, "TUTORIAL", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 30
        }).setOrigin(0.5, 0);

        let text = "In the game, you can control five chess in total.\nYou can equip one weapon and one armor for each of them.\nClick on the collectibles and choose which chess you want to\nequip for.\nClick on the equipped items to unequip.\nMove range for each chess: 3 \nAttack range for sword: 1 \nAttack range for bow: 3 \nAfter winning a match, you will have a chance to get some\ncollectibles and save into your ethereum address.";
        let tutorialText = this.add.text(170, 130, text, {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0);

        // Close box button
        let closeButton = this.add.text(400, 360, "CLOSE", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5).setDepth(1);
        closeButton.setInteractive();
        closeButton.on("pointerover", () => {
            closeButton.setStyle({ fill: "orange" });
        })
        closeButton.on("pointerout", () => {
            closeButton.setStyle({ fill: "white" });
        })
        closeButton.on("pointerup", () => {
            this.clearGroup(groupSprite);
        })

        // Add member into group
        groupSprite.add(tutorialBox);
        groupSprite.add(tutorialTitle);
        groupSprite.add(tutorialText);
        groupSprite.add(closeButton);
    }

    clearGroup(groupSprite) {
        groupSprite.clear(true, true);
    }

    setEventListeners() {
        this.emitter.on("createItemInterface", this.createItemInterface.bind(this));
        if (mode == "Multi") {

        }
    }

    createItemInterface(type, rareness, attribute, level, id) {
        let _id = parseInt(id);
        let existed = false;
        for (let i = 0; i < equipID.length; i++) {
            if (equipID[i] == _id) {
                existed = true;
            }
        }
        if (!existed) {
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

            if (thisX == 544) {
                thisX = 54;
                thisY = thisY + 70;
            } else {
                thisX = thisX + 70;
            }
            let item;
            if (_type == "Sword") {
                item = new Collectibles(this, thisX, thisY, _icon, frame).setScale(2).setOrigin(0.5);
            } else {
                item = new Collectibles(this, thisX, thisY, _icon, 0).setScale(2).setOrigin(0.5);
            }
            item.receiveItemData(_id, _name, _type, _rareness, _attribute, _level);
            item.setInteractive();
            item.on("pointerup", () => {
                selectedItem = item;
                this.showEquipMenu(selectedItem);
            });
            equipID.push(id);
        }
    }

    toMultiplay() {
        console.log("Ready go");
        let chess_data = playerChessGroup.getChildren();
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.scene.start(CST.SCENES.MPLAY, {
                    chess1: [chess_data[0].weaponType, chess_data[0].getAttack(), chess_data[0].getDefense(), chess_data[0].currentItemLevel],
                    chess2: [chess_data[1].weaponType, chess_data[1].getAttack(), chess_data[1].getDefense(), chess_data[1].currentItemLevel],
                    chess3: [chess_data[2].weaponType, chess_data[2].getAttack(), chess_data[2].getDefense(), chess_data[2].currentItemLevel],
                    chess4: [chess_data[3].weaponType, chess_data[3].getAttack(), chess_data[3].getDefense(), chess_data[3].currentItemLevel],
                    chess5: [chess_data[4].weaponType, chess_data[4].getAttack(), chess_data[4].getDefense(), chess_data[4].currentItemLevel],
                    mode: "Multi",
                    index: playerIndex
                });
            },
        })
    }

}

export default InventoryScene;