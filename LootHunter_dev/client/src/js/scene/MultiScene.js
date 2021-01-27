import { CST } from "../CST";
import Phaser from "phaser";
import Easystar from "easystarjs";
import CharacterSprite from "../util/CharacterSprite";
import EventDispatcher from "../util/EventDispatcher";

// Map variable
var level01;
var groundLayer;
// Marker for the pointer
var marker;
// Coordinate of the tile where the pointer is
var snappedWorldPoint;
// Sprite group for the action menu
var actionMenu;
// Sprite group for move range boxes and attack range boxes
var moveSquareGroup;
var attackSquareGroup;
var playerIndex;
// Chess group owned by player
var ownChessGroup;
// Chess group owned by enemy player
var enemyChessGroup;
// Action Status
var ownChessStatus = [false, false, false, false, false];
// Death Status
var ownDeathStatus = [false, false, false, false, false];
// Save currently selected chess and selected target
var selectedChess;
var selectedTarget;
// Turn number
var turnNumber;
// Text Dialog
var textDialog;
// Show details of current sprite
var detailGroup;
// Data transferred from last scene
var dataSet;
var data_set1;
var data_set2;
var data_set3;
var data_set4;
var data_set5;
var weaponSet;

class MultiScene extends Phaser.Scene {
    constructor() {
        super({
            key: CST.SCENES.MPLAY
        })

        // Event emitter
        this.emitter = EventDispatcher.getInstance();
        

        // Path finder
        this.finder = new Easystar.js();
    }

    init(data) {
        dataSet = data;
        data_set1 = data.chess1;
        data_set2 = data.chess2;
        data_set3 = data.chess3;
        data_set4 = data.chess4;
        data_set5 = data.chess5;
        weaponSet = [data_set1[0], data_set2[0], data_set3[0], data_set4[0], data_set5[0]];
        playerIndex = data.index;
    }

    preload() {
        this.anims.create({
            key: "human_walk_blue",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN_BLUE, {
                frames: [0, 1, 2, 1]
            })
        })

        this.anims.create({
            key: "human_bow_walk_blue",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN_BLUE, {
                frames: [3, 4, 5, 4]
            })
        })

        this.anims.create({
            key: "human_sword_walk_blue",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN_BLUE, {
                frames: [6, 7, 8, 7]
            })
        })

        this.anims.create({
            key: "human_walk_red",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN_RED, {
                frames: [0, 1, 2, 1]
            })
        })

        this.anims.create({
            key: "human_bow_walk_red",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN_RED, {
                frames: [3, 4, 5, 4]
            })
        })

        this.anims.create({
            key: "human_sword_walk_red",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN_RED, {
                frames: [6, 7, 8, 7]
            })
        })


        this.anims.create({
            key: "attackEffect",
            frameRate: 6,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.ATTACKEFFECT, {
                frames: [0, 1, 2, 3, 4, 5]
            })
        })

        this.anims.create({
            key: "deathEffect",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.DEATHEFFECT, {
                frames: [3, 2, 1, 0]
            })
        })

        this.load.image("terrain", "./assets/image/terrain.png");
        this.load.image("terrain_path", "./assets/image/terrain_path.png");
        this.load.image("terrain_water", "./assets/image/terrain_water.png");
        this.load.tilemapTiledJSON("level01", "./assets/maps/level01.json");
    }

    create() {
        this.input.on('pointerdown', () => {
            this.handleClick();
        });

        this.setEventListeners();

        // Init game map
        level01 = this.add.tilemap("level01");
        let terrain = level01.addTilesetImage("terrain");
        let terrain_path = level01.addTilesetImage("terrain_path");
        let terrain_water = level01.addTilesetImage("terrain_water");

        // Init map layers
        groundLayer = level01.createStaticLayer("Ground", [terrain, terrain_path, terrain_water], 0, 0);
        level01.createStaticLayer("Structure", [terrain], 0, 0);
        level01.createStaticLayer("Obstacle", [terrain], 0, 0);

        // Config path finder
        var grid = [];
        for (let y = 0; y < level01.height; y++) {
            var col = [];
            for (let x = 0; x < level01.width; x++) {
                col.push(this.getTileID(x, y));
            }
            grid.push(col);
        }
        this.finder.setGrid(grid);

        var tileset = level01.tilesets[0];
        var properties = tileset.tileProperties;
        var acceptableTiles = [];
        this.pushAcceptableTiles(tileset, properties, acceptableTiles, terrain);

        this.finder.setAcceptableTiles(acceptableTiles);

        // Set camera bounds
        this.cameras.main.setBounds(0, 0, 640, 640);

        // Config the marker for mouse pointer -> more user-friendly
        marker = this.add.graphics();
        marker.lineStyle(5, 0xffffff, 1);
        marker.strokeRect(0, 0, level01.tileWidth, level01.tileHeight);
        marker.lineStyle(3, 0xff4f78, 1);
        marker.strokeRect(0, 0, level01.tileWidth, level01.tileHeight);

        // Initialize groups for using later
        enemyChessGroup = this.add.group();
        moveSquareGroup = this.add.group();
        attackSquareGroup = this.add.group();
        actionMenu = this.add.group();
        detailGroup = this.add.group();

        // Create user interface on right hand side
        let chessPanel = this.add.graphics();
        chessPanel.lineStyle(3, 0xffffff, 1);
        chessPanel.strokeRect(this.game.renderer.width - 155, 5, 150, 312.5);

        // Create dialog for noticing the player on right hand side
        let textPanel = this.add.graphics();
        textPanel.lineStyle(3, 0xffffff, 1);
        textPanel.strokeRect(this.game.renderer.width - 155, 317.5, 150, 312.5);
        textPanel.fillStyle("black");
        textPanel.fillRect(this.game.renderer.width - 152, 320.5, 144, 306.5);
        let mask = new Phaser.Display.Masks.GeometryMask(this, textPanel);
        textDialog = this.add.text(this.game.renderer.width - 150, 320, "", {
            color: "white",
            fontFamily: "Arial",
            fontSize: 12,
            wordWrap: { width: 144 }
        });
        textDialog.setMask(mask);
        textDialog.y = textDialog.y - textDialog.height + 320;

        // Create player's chess
        ownChessGroup = this.add.group();
        for (let i = 0; i < 5; i++) {
            let ownChess;
            let characterFrame;
            switch (weaponSet[i]) {
                case "Unarmed":
                    characterFrame = 1;
                    break;
                case "Sword":
                    characterFrame = 7;
                    break;
                case "Bow":
                    characterFrame = 4;
                    break;
            }
            if (playerIndex == 1)
                ownChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 8, CST.SPRITE.HUMAN_BLUE, characterFrame, 1, i).setOrigin(0, 0);
            else
                ownChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 13, CST.SPRITE.HUMAN_BLUE, characterFrame, 2, i).setOrigin(0, 0);
            ownChess.setInteractive();
            ownChessGroup.add(ownChess);
        }

        // Transfer equippment data
        let playerSet = ownChessGroup.getChildren();
        playerSet[0].baseStatInit(dataSet.chess1[0], dataSet.chess1[1], dataSet.chess1[2], dataSet.chess1[3]);
        playerSet[1].baseStatInit(dataSet.chess2[0], dataSet.chess2[1], dataSet.chess2[2], dataSet.chess2[3]);
        playerSet[2].baseStatInit(dataSet.chess3[0], dataSet.chess3[1], dataSet.chess3[2], dataSet.chess3[3]);
        playerSet[3].baseStatInit(dataSet.chess4[0], dataSet.chess4[1], dataSet.chess4[2], dataSet.chess4[3]);
        playerSet[4].baseStatInit(dataSet.chess5[0], dataSet.chess5[1], dataSet.chess5[2], dataSet.chess5[3]);

        // User Interactions
        // Show enemy details when clicked on enemy
        this.input.on("gameobjectdown", (pointer, gameObject) => {

            let chess_check = enemyChessGroup.getChildren();

            for (let i = 0; i < enemyChessGroup.getLength(); i++) {
                if (gameObject == chess_check[i]) {
                    // Store selected object 
                    selectedChess = chess_check[i];

                    // Show chess details
                    this.cameras.main.centerOn(selectedChess.x, selectedChess.y);
                    this.showChessDetail(detailGroup, selectedChess);

                    // Update dialog
                    this.updateDialog("Investigate " + selectedChess.getIndex() + "\n", textDialog);
                }
            }
        });

        // Show action menu when player checks on his chess
        this.input.on("gameobjectdown", (pointer, gameObject) => {

            ownChessGroup.getChildren().forEach(chess => {
                if (gameObject == chess) {
                    selectedChess = chess;
                    this.cameras.main.centerOn(selectedChess.x, selectedChess.y);
                    this.showChessDetail(detailGroup, selectedChess);
                    if (!selectedChess.statusCheck("Finish") && !selectedChess.statusCheck("Dead")) {
                        // Show the action menu to player
                        this.showActionMenu(selectedChess, snappedWorldPoint.x, snappedWorldPoint.y, this.emitter);

                        // Update dialog
                        this.updateDialog("Selected chess " + selectedChess.getIndex() + "\n", textDialog);
                    } else {
                        // Update dialog
                        this.updateDialog("No available action\n", textDialog);
                    }
                }
            })
        });

        // Movement input detection
        this.input.setHitArea(moveSquareGroup.getChildren()).on('gameobjectdown', (pointer, gameObject) => {
            moveSquareGroup.getChildren().forEach(moveBox => {
                if (gameObject == moveBox) {
                    // Perform move action
                    this.pathFinding(selectedChess, snappedWorldPoint.x, snappedWorldPoint.y);
                    selectedChess.performAction("Move");

                    // Update dialog
                    this.updateDialog("Your chess " + selectedChess.getIndex() + " moves to (" + selectedChess.getPositionX() + "," + selectedChess.getPositionY() + ")\n", textDialog);

                    // Update information for enemy player
                    this.emitter.emit("updateMove", selectedChess.getIndex(), moveBox.x, moveBox.y);
                }
            })
            this.clearGroup(moveSquareGroup);
        });

        // Attack input detection
        this.input.setHitArea(attackSquareGroup.getChildren()).on('gameobjectdown', (pointer, gameObject) => {
            attackSquareGroup.getChildren().forEach(attackBox => {
                if (gameObject == attackBox) {
                    // Check attack target validity
                    enemyChessGroup.getChildren().forEach(chess => {
                        // As attackBox gives non-tile coordinates, dividing them with tile width & tile height is needed
                        if ((attackBox.x / 32) == chess.getPositionX() && (attackBox.y / 32) == chess.getPositionY()) {
                            selectedTarget = chess;

                            // Perform attack action
                            selectedTarget.getHit(selectedChess);
                            selectedChess.performAction("Attack");
                            this.switchAttackAni(selectedTarget, selectedChess.getWeaponType());

                            // Update dialog
                            this.updateDialog("Your chess " + selectedChess.getIndex() + " attacked enemy chess " + selectedTarget.getIndex() + "\n", textDialog);

                            // Update information for enemy player
                            this.emitter.emit("updateAttack", selectedChess.getIndex(), selectedTarget.getIndex());
                        }
                    })
                }
            });
            this.clearGroup(attackSquareGroup);
        });

        this.time.addEvent({
            delay: 1500,
            callback: () => {
                this.emitter.emit("transferChessData", playerIndex, dataSet);
                if (playerIndex == 2) {
                    this.emitter.emit("nextTurn", playerIndex);
                }
            }
        });
        turnNumber = 0;
    }

    // Event listener functions
    setEventListeners() {
        // In-match Events
        this.emitter.on("roundControl", this.roundControl.bind(this));
        this.emitter.on("clearChess", this.clearChess.bind(this));
        this.emitter.on("statusUpdate", this.statusUpdate.bind(this));
        this.emitter.on("announceResult", this.announceResult.bind(this));

        // Enemy Player Events
        this.emitter.on("createEnemyChess", this.createEnemyChess.bind(this));
        this.emitter.on("updateEnemyPosition", this.updateEnemyPosition.bind(this));
        this.emitter.on("updateEnemyAttack", this.updateEnemyAttack.bind(this));
    }

    // Event listener functions
    roundControl(enemyPlayerIndex) {
        turnNumber += 1;
        // Update dialog
        this.updateDialog("Turn number: " + turnNumber + "\n", textDialog);
        /* 
            Determine player's action turn
            Odd number turns: player 1 (Host)
            Even number turns: player 2
        */
        if (enemyPlayerIndex != playerIndex) {
            this.unlockPlayer();
            // Update dialog
            this.updateDialog("This is your turn\n", textDialog);
        }
    }

    clearChess(sprite) {
        let effect;
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                effect = this.add.sprite(sprite.x, sprite.y, CST.SPRITE.DEATHEFFECT).setDepth(1).setOrigin(0, 0);
                effect.anims.play("deathEffect");
            }
        });
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                sprite.x = -32;
                sprite.y = -32;
                sprite.updatePosition(-1, -1);
                effect.destroy();
                console.log(ownDeathStatus);
                if (sprite.getOwnerIndex() == playerIndex) {
                    ownDeathStatus[sprite.getIndex()] = true;
                    console.log(ownDeathStatus);
                    if (ownDeathStatus.every(Boolean))
                        this.emitter.emit("playerLose", playerIndex);
                }
            }
        });
    }

    statusUpdate(status, chessIndex, bool) {
        switch (status) {
            case "Finish":
                ownChessStatus[chessIndex] = bool;
                if (ownChessStatus.every(Boolean)) {
                    ownChessGroup.getChildren().forEach(chess => {
                        if (!chess.statusCheck("Dead"))
                            ownChessStatus[chess.getIndex()] = false;
                    })
                    this.emitter.emit("nextTurn", playerIndex);
                }
                break;
            case "Dead":
                ownChessStatus[chessIndex] = bool;
                break;
        }
    }

    announceResult(enemyPlayerIndex) {
        if (enemyPlayerIndex != playerIndex) {
            this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, CST.IMAGE.WIN);
            this.showEndingButton();
        } else {
            this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, CST.IMAGE.LOSE);
            this.showEndingButton();
        }
    }

    createEnemyChess(enemyPlayerIndex, enemyDataSet) {
        let enemyWeaponSet = [enemyDataSet.chess1[0], enemyDataSet.chess2[0], enemyDataSet.chess3[0], enemyDataSet.chess4[0], enemyDataSet.chess5[0]];
        for (let i = 0; i < 5; i++) {
            let enemyChess;
            let characterFrame;
            switch (enemyWeaponSet[i]) {
                case "Unarmed":
                    characterFrame = 1;
                    break;
                case "Sword":
                    characterFrame = 7;
                    break;
                case "Bow":
                    characterFrame = 4;
                    break;
            }
            if (enemyPlayerIndex == 1)
                enemyChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 8, CST.SPRITE.HUMAN_RED, characterFrame, 1, i).setOrigin(0, 0);
            else
                enemyChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 13, CST.SPRITE.HUMAN_RED, characterFrame, 2, i).setOrigin(0, 0);

            enemyChess.setInteractive();
            enemyChessGroup.add(enemyChess);
        }
        let enemySet = enemyChessGroup.getChildren();
        enemySet[0].baseStatInit(enemyDataSet.chess1[0], enemyDataSet.chess1[1], enemyDataSet.chess1[2], enemyDataSet.chess1[3]);
        enemySet[1].baseStatInit(enemyDataSet.chess2[0], enemyDataSet.chess2[1], enemyDataSet.chess2[2], enemyDataSet.chess2[3]);
        enemySet[2].baseStatInit(enemyDataSet.chess3[0], enemyDataSet.chess3[1], enemyDataSet.chess3[2], enemyDataSet.chess3[3]);
        enemySet[3].baseStatInit(enemyDataSet.chess4[0], enemyDataSet.chess4[1], enemyDataSet.chess4[2], enemyDataSet.chess4[3]);
        enemySet[4].baseStatInit(enemyDataSet.chess5[0], enemyDataSet.chess5[1], enemyDataSet.chess5[2], enemyDataSet.chess5[3]);
    }

    updateEnemyPosition(chessId, positionX, positionY) {
        enemyChessGroup.getChildren().forEach(chess => {
            if (chess.getIndex() == chessId) {
                this.pathFinding(chess, positionX, positionY);
                // Update dialog
                this.updateDialog("Enemy chess " + chess.getIndex() + " moves to (" + chess.getPositionX() + "," + chess.getPositionY() + ")\n", textDialog);
            }
        })
    }

    updateEnemyAttack(chessId, targetId) {
        let attacker;
        let target;
        enemyChessGroup.getChildren().forEach(chess => {
            if (chess.getIndex() == chessId) {
                attacker = chess;
            }
        })
        ownChessGroup.getChildren().forEach(chess => {
            if (chess.getIndex() == targetId) {
                target = chess;
                target.getHit(attacker);
                attacker.performAction("Attack");
                this.switchAttackAni(target, attacker.getWeaponType());
            }
        })
        this.updateDialog("Enemy chess " + target.getIndex() + " attacked your chess " + attacker.getIndex() + "\n", textDialog);
    }

    // Game initialize functions
    // Get tile ID for path finder
    getTileID(x, y) {
        var tile = groundLayer.getTileAt(x, y);
        return tile.index;
    }

    // Push acceptable tiles to path finder
    pushAcceptableTiles(tileset, properties, acceptableTiles, terrain) {
        for (var i = tileset.firstgid - 1; i < terrain.total; i++) { // firstgid and total are fields from Tiled that indicate the range of IDs that the tiles can take in that tileset
            if (!properties.hasOwnProperty(i)) {
                // If there is no property indicated at all, it means it's a walkable tile
                acceptableTiles.push(i + 1);
                continue;
            }
            if (!properties[i].collide) acceptableTiles.push(i + 1);
            if (properties[i].cost) this.finder.setTileCost(i + 1, properties[i].cost); // If there is a cost attached to the tile, let's register it
        }
    }

    // Local interactive functions
    // Show chess detail when player clicks on the chess
    showChessDetail(groupSprite, sprite) {
        if (groupSprite.getChildren() != 0) {
            // Call the group clearing function if this is still member inside
            this.clearGroup(groupSprite);
        }

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
        groupSprite.add(chessHealth);
        groupSprite.add(chessAttack);
        groupSprite.add(chessDefense);
    }

    showActionMenu(currentSprite, snappedWorldPointX, snappedWorldPointY) {
        // Make sure no multiple menu on the screen
        if (actionMenu.getChildren() != 0) {
            this.clearGroup(actionMenu);
        }

        // Create popup action menu
        let menuBox = this.add.image(0, 0, CST.IMAGE.MENUBOX);

        // Create menu buttons
        let moveButton = this.add.text(0, 0, "MOVE", {
            fill: "black",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 16
        }).setOrigin(0.5);
        moveButton.setInteractive();
        let attackButton = this.add.text(0, 0, "ATTACK", {
            fill: "black",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 16
        }).setOrigin(0.5);
        attackButton.setInteractive();
        let waitButton = this.add.text(0, 0, "WAIT", {
            fill: "black",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 16
        }).setOrigin(0.5);
        waitButton.setInteractive();

        // Add the buttons into the action menu for management
        actionMenu.add(menuBox);
        actionMenu.add(moveButton);
        actionMenu.add(attackButton);
        actionMenu.add(waitButton);

        // Callback when the button is clicked
        // Move button
        moveButton.on("pointerover", () => {
            if (selectedChess.statusCheck("Move"))
                moveButton.setStyle({ fill: "red" });
            else
                moveButton.setStyle({ fill: "green" });
        });
        moveButton.on("pointerout", () => {
            moveButton.setStyle({ fill: "black" });
        });
        moveButton.on("pointerup", () => {
            this.clearGroup(actionMenu);
            if (!currentSprite.statusCheck("Move")) {
                this.showMoveRange(moveSquareGroup, currentSprite, currentSprite.getMoveRange());
            } else {
                this.updateDialog("This chess already moved\n", textDialog);
            }
        });
        // Attack button
        attackButton.on("pointerover", () => {
            if (selectedChess.statusCheck("Attack"))
                attackButton.setStyle({ fill: "red" });
            else
                attackButton.setStyle({ fill: "green" });
        });
        attackButton.on("pointerout", () => {
            attackButton.setStyle({ fill: "black" });
        });
        attackButton.on("pointerup", () => {
            this.clearGroup(actionMenu);
            if (!currentSprite.statusCheck("Attack")) {
                this.showAttackRange(attackSquareGroup, currentSprite, currentSprite.getAttackRange());
            } else {
                this.updateDialog("This chess already attacked\n", textDialog);
            }
        });
        // Wait button
        waitButton.on("pointerover", () => {
            waitButton.setStyle({ fill: "green" });
        });
        waitButton.on("pointerout", () => {
            waitButton.setStyle({ fill: "black" });
        });
        waitButton.on("pointerup", () => {
            this.clearGroup(actionMenu);
            currentSprite.performAction("Wait");
        });

        // Modify its location to the selected chess
        if (currentSprite.getPositionX() > 17) {
            menuBox.x = snappedWorldPointX - 32;
            menuBox.y = snappedWorldPointY + 64;
            moveButton.x = (snappedWorldPointX) - 64 / 2;
            moveButton.y = (snappedWorldPointY + 32) + 21 / 2;
            attackButton.x = (snappedWorldPointX) - 64 / 2;
            attackButton.y = (snappedWorldPointY + 32) + 21 / 2 + 21;
            waitButton.x = (snappedWorldPointX) - 64 / 2;
            waitButton.y = (snappedWorldPointY + 32) + 21 / 2 + 42;
        } else if (currentSprite.getPositionY() > 17) {
            menuBox.x = snappedWorldPointX + 64;
            menuBox.y = snappedWorldPointY - 32;
            moveButton.x = (snappedWorldPointX + 32) + 64 / 2;
            moveButton.y = (snappedWorldPointY - 32) - 21;
            attackButton.x = (snappedWorldPointX + 32) + 64 / 2;
            attackButton.y = (snappedWorldPointY - 32);
            waitButton.x = (snappedWorldPointX + 32) + 64 / 2;
            waitButton.y = (snappedWorldPointY - 32) + 21;
        }
        else {
            menuBox.x = snappedWorldPointX + 64;
            menuBox.y = snappedWorldPointY + 64;
            moveButton.x = (snappedWorldPointX + 32) + 64 / 2;
            moveButton.y = (snappedWorldPointY + 32) + 21 / 2;
            attackButton.x = (snappedWorldPointX + 32) + 64 / 2;
            attackButton.y = (snappedWorldPointY + 32) + 21 / 2 + 21;
            waitButton.x = (snappedWorldPointX + 32) + 64 / 2;
            waitButton.y = (snappedWorldPointY + 32) + 21 / 2 + 42;
        }
    }

    // Show available movement range
    showMoveRange(groupSprite, sprite, moveRange) {
        // Put every coordinate into check function then only produce the available box
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                this.moveRangeCheck(sprite, groupSprite, i, j, moveRange);
            }
        }
    }

    // Show available attack range
    showAttackRange(groupSprite, sprite, attackRange) {
        let attackBox;
        let boxAmount = 1;
        for (let i = 0; i < attackRange * 2 + 1; i++) {
            if (i < attackRange) {
                for (let j = 0; j < boxAmount; j++) {
                    attackBox = this.physics.add.sprite(sprite.x - (32 * i) + (32 * j), sprite.y - 32 * (attackRange - i), CST.IMAGE.ATTACKSQUARE).setOrigin(0, 0);
                    attackBox.setInteractive();
                    groupSprite.add(attackBox);
                }
                boxAmount += 2;
            } else if (i == attackRange) {
                for (let j = 0; j < boxAmount; j++) {
                    if ((sprite.x - (32 * i) + (32 * j)) != sprite.x) {
                        attackBox = this.physics.add.sprite(sprite.x - (32 * i) + (32 * j), sprite.y, CST.IMAGE.ATTACKSQUARE).setOrigin(0, 0);
                        attackBox.setInteractive();
                        groupSprite.add(attackBox);
                    }
                }
                boxAmount -= 2;
            } else if (i > attackRange) {
                for (let j = 0; j < boxAmount; j++) {
                    attackBox = this.physics.add.sprite(sprite.x - 32 * (attackRange * 2 - i) + (32 * j), sprite.y + 32 * (i - attackRange), CST.IMAGE.ATTACKSQUARE).setOrigin(0, 0);
                    attackBox.setInteractive();
                    groupSprite.add(attackBox);
                }
                boxAmount -= 2;
            }
        }
    }

    showEndingButton() {
        let endingBox = this.add.graphics();
        endingBox.lineStyle(3, 0xffffff, 1);
        endingBox.strokeRect(this.game.renderer.width / 2 - 40, this.game.renderer.height / 2 + 95, 80, 30);
        endingBox.fillStyle(0x000000, 1);
        endingBox.fillRect(this.game.renderer.width / 2 - 40, this.game.renderer.height / 2 + 95, 80, 30);
        let endingButton = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2 + 110, "Confirm", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 20
        }).setOrigin(0.5);
        endingButton.setInteractive();
        endingButton.on("pointerover", () => {
            endingButton.setStyle({ fill: "orange" });
        })
        endingButton.on("pointerout", () => {
            endingButton.setStyle({ fill: "white" });
        })
        endingButton.on("pointerup", () => {
            this.emitter.emit("disconnect");
            this.scene.start(CST.SCENES.MENU);
        })
    }

    handleClick() {
        this.sound.play(CST.AUDIO.CLICK);
    }

    // Local game operate functions
    unlockPlayer() {
        ownChessGroup.getChildren().forEach(chessChild => {
            if (!chessChild.statusCheck("Dead"))
                chessChild.isNewTurn();
            ownChessStatus[chessChild.getIndex()] = chessChild.statusCheck("Finish");
        })
    }

    // Update in-game dialog
    updateDialog(string, textDialog) {
        let oldHeight = textDialog.height;
        textDialog.text += string;
        let difference = textDialog.height - oldHeight;
        textDialog.y = textDialog.y - difference;
    }

    // Clear and destory members in the group
    clearGroup(groupSprite) {
        groupSprite.clear(true, true);
    }

    // Movement handling functions
    // Check available moveable coordinate
    moveRangeCheck(sprite, groupSprite, targetX, targetY, moveRange) {
        this.finder.findPath(sprite.x / 32, sprite.y / 32, targetX, targetY, (path) => {
            if (path == null || path.length > (moveRange + 1)) {

            } else {
                if (!this.characterOverlay(targetX, targetY))
                    this.printMoveBox(groupSprite, targetX, targetY);
            }
        });
        this.finder.calculate();
    }

    // Avoid overlaying other characters
    characterOverlay(targetX, targetY) {
        let overlay = false;
        ownChessGroup.getChildren().forEach(chessChild => {
            if (targetX == chessChild.getPositionX() && targetY == chessChild.getPositionY())
                overlay = true;
        })
        enemyChessGroup.getChildren().forEach(chessChild => {
            if (targetX == chessChild.getPositionX() && targetY == chessChild.getPositionY())
                overlay = true;
        })
        return overlay;
    }

    // Display the moveable area to player
    printMoveBox(groupSprite, targetX, targetY) {
        let moveBox = this.physics.add.sprite(targetX * 32, targetY * 32, CST.IMAGE.MOVESQUARE).setOrigin(0, 0);
        moveBox.setInteractive();
        groupSprite.add(moveBox);
    }

    // Find the path after player chooses where to move
    pathFinding(sprite, targetX, targetY) {
        this.finder.findPath(sprite.x / 32, sprite.y / 32, targetX / 32, targetY / 32, (path) => {
            sprite.updatePosition(targetX / 32, targetY / 32);
            this.moveCharacter(path, sprite);
        });
        this.finder.calculate();
    }

    // Move the selected character to target position
    moveCharacter(path, sprite) {
        var tweens = [];
        for (let i = 0; i < path.length - 1; i++) {
            var ex = path[i + 1].x;
            var ey = path[i + 1].y;
            tweens.push({
                targets: sprite,
                x: { value: ex * level01.tileWidth, duration: 300 },
                y: { value: ey * level01.tileHeight, duration: 300 },

            })
        }
        this.switchMoveAni(sprite);
        this.sound.play(CST.AUDIO.WALK, {
            repeat: path.length
        });
        this.tweens.timeline({
            tweens: tweens
        })
    }

    // Animation handling functions
    // Switch animation according to weapon equipped
    switchMoveAni(sprite) {
        if (sprite.getOwnerIndex() == playerIndex)
            switch (sprite.getWeaponType()) {
                case "Unarmed":
                    sprite.anims.play("human_walk_blue");
                    break;
                case "Sword":
                    sprite.anims.play("human_sword_walk_blue");
                    break;
                case "Bow":
                    sprite.anims.play("human_bow_walk_blue");
                    break;
            }
        else
            switch (sprite.getWeaponType()) {
                case "Unarmed":
                    sprite.anims.play("human_walk_red");
                    break;
                case "Sword":
                    sprite.anims.play("human_sword_walk_red");
                    break;
                case "Bow":
                    sprite.anims.play("human_bow_walk_red");
                    break;
            }
    }

    switchAttackAni(target, chessType) {
        let effect;
        effect = this.add.sprite(target.x, target.y, CST.SPRITE.ATTACKEFFECT).setDepth(1).setOrigin(0, 0);
        effect.anims.play("attackEffect");
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                effect.destroy();
            }
        });
        switch (chessType) {
            case "Sword":
                this.sound.play(CST.AUDIO.SWORD, {volume: 0.3});
                break;
            case "Bow":
                this.sound.play(CST.AUDIO.ARROW, {volume: 0.3});
                break;
        }
    }

    update() {
        // Convert the mouse position to world position within the camera
        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);

        // Place the marker in world space, but snap it to the tile grid. If we convert world -> tile and
        // then tile -> world, we end up with the position of the tile under the pointer
        const pointerTileXY = groundLayer.worldToTileXY(worldPoint.x, worldPoint.y);
        snappedWorldPoint = groundLayer.tileToWorldXY(pointerTileXY.x, pointerTileXY.y);
        if (snappedWorldPoint.x < 640)
            marker.setPosition(snappedWorldPoint.x, snappedWorldPoint.y);
    }
}

export default MultiScene;