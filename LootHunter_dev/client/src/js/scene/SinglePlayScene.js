import { CST } from "../CST";
import Phaser from "phaser";
import Easystar from "easystarjs";
import CharacterSprite from "../util/CharacterSprite";
import EventDispatcher from "../util/EventDispatcher";
import AI from "../util/AI";
import MatchRecord from "../util/MatchRecord";

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
// Chess group owned by player
var playerChessGroup;
// Chess group owned by AI
var aiChessGroup;
// Action Status
var playerChessStatus;
// Death Status
var playerDeathStatus;
var aiDeathStatus;
// Save currently selected chess and selected target
var selectedChess;
var selectedTarget;
// Turn number
var matchNumber;
var turnNumber;
// Text Dialog
var textDialog;
// Show details of current sprite
var detailGroup;
// Data transferred from last scene
var data_set1;
var data_set2;
var data_set3;
var data_set4;
var data_set5;
var weaponSet;

var mode;

class SinglePlayScene extends Phaser.Scene {

    constructor() {
        super({
            key: CST.SCENES.SPLAY,
        });

        // Event emitter
        this.emitter = EventDispatcher.getInstance();

        // Match Record
        this.recorder = new MatchRecord();

        // Path finder
        this.finder = new Easystar.js();

        // Trained AI
        this.aiOpponent = AI.getInstance();
    }

    init(data) {
        mode = data.mode;
        console.log("Game mode: " + mode);
        if (mode == "New") {
            data_set1 = data.chess1;
            data_set2 = data.chess2;
            data_set3 = data.chess3;
            data_set4 = data.chess4;
            data_set5 = data.chess5;
            weaponSet = [data_set1[0], data_set2[0], data_set3[0], data_set4[0], data_set5[0]];
        } else if (mode == "Rewind" || mode == "Rewind(New)") {
            matchNumber = data.matchIndex;
            turnNumber = data.roundIndex;
        }

    }

    preload() {

        this.anims.create({
            key: "human_walk",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN, {
                frames: [0, 1, 2, 1]
            })
        })

        this.anims.create({
            key: "human_bow_walk",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN, {
                frames: [3, 4, 5, 4]
            })
        })

        this.anims.create({
            key: "human_sword_walk",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.HUMAN, {
                frames: [6, 7, 8, 7]
            })
        })

        this.anims.create({
            key: "skeleton_walk",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.SKELETON, {
                frames: [0, 1, 2, 1]
            })
        })

        this.anims.create({
            key: "mage_walk",
            frameRate: 4,
            frames: this.anims.generateFrameNumbers(CST.SPRITE.MAGE, {
                frames: [0, 1, 2, 1]
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

        // Initialize variable and group
        playerChessStatus = [false, false, false, false, false];
        playerDeathStatus = [false, false, false, false, false];
        aiDeathStatus = [false, false, false, false, false];

        playerChessGroup = this.add.group();
        aiChessGroup = this.add.group();


        if (mode == "New") {
            // Create sprites by group according to player
            for (let i = 0; i < 5; i++) {
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
                let playerChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 8, CST.SPRITE.HUMAN, characterFrame, 1, i).setOrigin(0, 0);
                playerChess.setInteractive();
                playerChessGroup.add(playerChess);
            }
            // Transfer equippment data
            let playerSet = playerChessGroup.getChildren();
            playerSet[0].baseStatInit(data_set1[0], data_set1[1], data_set1[2], data_set1[3]);
            playerSet[1].baseStatInit(data_set2[0], data_set2[1], data_set2[2], data_set2[3]);
            playerSet[2].baseStatInit(data_set3[0], data_set3[1], data_set3[2], data_set3[3]);
            playerSet[3].baseStatInit(data_set4[0], data_set4[1], data_set4[2], data_set4[3]);
            playerSet[4].baseStatInit(data_set5[0], data_set5[1], data_set5[2], data_set5[3]);

            // Create CharacterSprite for AI
            for (let i = 0; i < 5; i++) {
                let aiChess;
                if (i % 2 == 0) {
                    aiChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 13, CST.SPRITE.SKELETON, 1, 1, (i + 5)).setOrigin(0, 0);
                    aiChess.enemyStatInit(aiChess, "Skeleton");
                } else {
                    aiChess = new CharacterSprite(this, level01.tileWidth * 10 + (level01.tileWidth * i), level01.tileHeight * 14, CST.SPRITE.MAGE, 1, 1, (i + 5)).setOrigin(0, 0);
                    aiChess.enemyStatInit(aiChess, "Mage");
                }
                aiChess.setInteractive();
                aiChessGroup.add(aiChess);
            }
        } else if (mode == "Rewind" || mode == "Rewind(New)") {
            for (let i = 0; i < 10; i++) {
                this.emitter.emit("getRewindData", matchNumber, turnNumber, i);
            }
        }

        // User Interactions
        // Create rewind button
        let rewindButton = this.add.text(this.game.renderer.width - 80, 300, "REWIND", {
            fill: "white",
            fontFamily: CST.FONT.GEORGIA,
            fontSize: 18
        }).setOrigin(0.5);
        rewindButton.setInteractive();
        rewindButton.on("pointerover", () => {
            rewindButton.setStyle({ fill: "green" });
        });
        rewindButton.on("pointerout", () => {
            rewindButton.setStyle({ fill: "white" });
        });
        rewindButton.on("pointerup", () => {
            turnNumber = this.recorder.roundRewind(playerChessGroup, aiChessGroup);
        });

        // Show enemy details when clicked on enemy
        this.input.on("gameobjectdown", (pointer, gameObject) => {

            let chess_check = aiChessGroup.getChildren();

            for (let i = 0; i < aiChessGroup.getLength(); i++) {
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

            let chess_check = playerChessGroup.getChildren();

            for (let i = 0; i < playerChessGroup.getLength(); i++) {
                if (gameObject == chess_check[i]) {
                    // Store selected object 
                    selectedChess = chess_check[i];

                    // Show chess details
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
            }
        });

        // Movement input detection
        this.input.setHitArea(moveSquareGroup.getChildren()).on('gameobjectdown', (pointer, gameObject) => {

            let moveBox_check = moveSquareGroup.getChildren();

            for (let i = 0; i < moveSquareGroup.getLength(); i++) {
                if (gameObject == moveBox_check[i]) {
                    // Record action for rewind
                    this.recorder.updateActionRecord(selectedChess, turnNumber, "Move", null);
                    let previousX = selectedChess.getPositionX();
                    let previousY = selectedChess.getPositionY();
                    // Perform move action
                    this.pathFinding(selectedChess);
                    selectedChess.performAction("Move");

                    // Save data for AI training 
                    this.aiOpponent.saveMoveChoice(selectedChess, aiChessGroup, previousX, previousY);

                    // Update dialog
                    this.updateDialog("Your chess " + selectedChess.getIndex() + " moves to (" + moveBox_check[i].x / 32 + "," + moveBox_check[i].y / 32 + ")\n", textDialog);
                }
            }
            this.clearGroup(moveSquareGroup);
        });

        // Attack input detection
        this.input.setHitArea(attackSquareGroup.getChildren()).on('gameobjectdown', (pointer, gameObject) => {

            let attackBox_check = attackSquareGroup.getChildren();

            for (let i = 0; i < attackSquareGroup.getLength(); i++) {
                if (gameObject == attackBox_check[i]) {
                    // Check attack target validity
                    aiChessGroup.getChildren().forEach(chessChild => {
                        // As attackBox gives non-tile coordinates, dividing them with tile width & tile height is needed
                        if ((attackBox_check[i].x / 32) == chessChild.getPositionX() && (attackBox_check[i].y / 32) == chessChild.getPositionY()) {
                            selectedTarget = chessChild;

                            // Record action for rewind
                            this.recorder.updateActionRecord(selectedChess, turnNumber, "Attack", selectedTarget);

                            // Save data for AI training
                            this.aiOpponent.saveAttackChoice(selectedChess, selectedTarget, aiChessGroup);

                            // Perform attack action
                            selectedTarget.getHit(selectedChess);
                            selectedChess.performAction("Attack");
                            this.switchAttackAni(selectedTarget, selectedChess.getWeaponType());



                            // Update dialog
                            this.updateDialog("Your chess " + selectedChess.getIndex() + " attacked Chess " + selectedTarget.getIndex() + "\n", textDialog);
                        }
                    })
                }
            }
            this.clearGroup(attackSquareGroup);
        });

        // Define turn number and call matchStart()
        if (mode == "New") {
            turnNumber = 0;
            this.emitter.emit("getMatchIndex", "Match");
            this.time.addEvent({
                delay: 1000,
                callback: () => {
                    this.updateRoundRecord(turnNumber);
                    this.matchStart();
                }
            });
        } else if (mode == "Rewind(New)") {
            this.time.addEvent({
                delay: 5000,
                callback: () => {
                    this.updateRoundRecord(turnNumber);
                }
            });
        } else if (mode == "Rewind") {
            this.time.addEvent({
                delay: 3000,
                callback: () => {
                    this.turnControl();
                }
            });
        }
    }

    // Event listener functions
    setEventListeners() {

        // In-match Events
        this.emitter.on("turnControl", this.turnControl.bind(this));
        this.emitter.on("setMatchIndex", this.setMatchIndex.bind(this));
        this.emitter.on("aiFindPath", this.aiFindPath.bind(this));
        this.emitter.on("aiFindTarget", this.aiFindTarget.bind(this));
        this.emitter.on("clearChess", this.clearChess.bind(this));
        this.emitter.on("statusUpdate", this.statusUpdate.bind(this));

        // Rewind Events
        this.emitter.on("sendRewindData", this.sendRewindData.bind(this));
    }

    // Event listener functions
    turnControl() {
        turnNumber += 1;
        if (mode == "New" || mode == "Rewind(New)") {
            this.updateDialog("Blockchain record updated\n", textDialog);
        }
        // Update dialog
        this.updateDialog("Turn number: " + turnNumber + "\n", textDialog);
        /* 
            Determine player's action turn
            Odd number turns: player
            Even number turns: computer
        */
        if (turnNumber % 2 == 1) {
            this.unlockPlayer("Player");
            // Update dialog
            this.updateDialog("This is your turn\n", textDialog);
        } else {
            this.unlockPlayer("AI");
        }
    }

    setMatchIndex(index) {
        matchNumber = index;
        console.log(matchNumber);
    }

    aiFindPath(sprite, targetX, targetY) {
        this.showMoveRange(moveSquareGroup, sprite, sprite.getMoveRange());
        let closetBox;
        let closestDistance = 100;
        let currentDistance = Phaser.Math.Distance.Between(sprite.x / 32, sprite.y / 32, targetX, targetY);
        this.time.addEvent({
            delay: 500,
            callback: () => {
                moveSquareGroup.getChildren().forEach(moveBox => {
                    let dis = Phaser.Math.Distance.Between(moveBox.x / 32, moveBox.y / 32, targetX, targetY);
                    if (dis <= closestDistance) {
                        closestDistance = dis;
                        closetBox = moveBox;
                    }
                });
            }
        });
        // Record action for rewind
        this.recorder.updateActionRecord(sprite, turnNumber, "Move", null);
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (closestDistance < currentDistance) {
                    this.finder.findPath(sprite.x / 32, sprite.y / 32, closetBox.x / 32, closetBox.y / 32, (path) => {

                        sprite.updatePosition(closetBox.x / 32, closetBox.y / 32);
                        this.moveCharacter(path, sprite);
                    });
                    this.finder.calculate();
                    this.clearGroup(moveSquareGroup);
                    sprite.performAction("Move");
                } else {
                    this.clearGroup(moveSquareGroup);
                    sprite.performAction("Move");
                }

            }
        });
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (!sprite.statusCheck("Attack")) {
                    this.aiOpponent.aiAttack(sprite, playerChessGroup);
                }
            }
        });

    }

    aiFindTarget(sprite, enemy) {
        this.showAttackRange(attackSquareGroup, sprite, sprite.getAttackRange());
        let currentDistance = Phaser.Math.Distance.Between(sprite.x / 32, sprite.y / 32, enemy.getPositionX(), enemy.getPositionY());
        if (currentDistance <= sprite.getAttackRange()) {
            attackSquareGroup.getChildren().forEach(attackBox => {
                if (attackBox.x / 32 == enemy.getPositionX() && attackBox.y / 32 == enemy.getPositionY()) {
                    // Record action for rewind
                    this.recorder.updateActionRecord(sprite, turnNumber, "Attack", enemy);
                    enemy.getHit(sprite);
                    sprite.performAction("Attack");
                    this.switchAttackAni(enemy, sprite.getWeaponType());
                }
            });
        } else {
            let closestDistance = 100;
            let closestTarget;
            playerChessGroup.getChildren().forEach(chess => {
                let dis = Phaser.Math.Distance.Between(sprite.x / 32, sprite.y / 32, chess.x / 32, chess.y / 32);
                if (dis <= closestDistance) {
                    closestDistance = dis;
                    closestTarget = chess;
                }
            });
            attackSquareGroup.getChildren().forEach(attackBox => {
                if (attackBox.x / 32 == closestTarget.getPositionX() && attackBox.y / 32 == closestTarget.getPositionY()) {
                    // Record action for rewind
                    this.recorder.updateActionRecord(sprite, turnNumber, "Attack", closestTarget);
                    closestTarget.getHit(sprite);
                    sprite.performAction("Attack");
                    this.switchAttackAni(closestTarget, sprite.getWeaponType());
                }
            });
        }

        this.clearGroup(attackSquareGroup);
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
                // sprite.updatePosition(-1, -1);
                effect.destroy();
                if (sprite.getIndex() >= 5) {
                    aiDeathStatus[sprite.getIndex() - 5] = true;
                    console.log("AI chess Death Status:");
                    console.log(aiDeathStatus);
                    if (aiDeathStatus.every(Boolean))
                        this.showResult("Player");
                } else {
                    playerDeathStatus[sprite.getIndex()] = true;
                    console.log("Player chess Death Status:");
                    console.log(playerDeathStatus);
                    if (playerDeathStatus.every(Boolean))
                        this.showResult("AI");
                }
            }
        });
    }

    statusUpdate(status, chessIndex, bool) {
        switch (status) {
            case "Finish":
                playerChessStatus[chessIndex] = bool;
                if (playerChessStatus.every(Boolean) && turnNumber % 2 == 1) {
                    playerChessGroup.getChildren().forEach(chess => {
                        if (chess.statusCheck("Dead") != true)
                            playerChessStatus[chess.getIndex()] = false;
                    })
                    if (mode == "New" || mode == "Rewind(New)")
                        this.updateRoundRecord(turnNumber);
                    else if (mode == "Rewind")
                        this.turnControl();
                }
                break;
            case "Dead":
                playerChessStatus[chessIndex] = bool;
                break;
        }
    }

    sendRewindData(chessId, weaponType, attack, defense, health, xCord, yCord) {
        if (chessId < 5) {
            let characterFrame;
            switch (weaponType) {
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
            let playerChess = new CharacterSprite(this, xCord * 32, yCord * 32, CST.SPRITE.HUMAN, characterFrame, 1, chessId).setOrigin(0, 0);
            playerChess.setInteractive();
            playerChess.baseStatInit(weaponType, parseInt(attack), parseInt(defense), 0);
            playerChess.rewindInit(parseInt(health), parseInt(xCord), parseInt(yCord));
            if (playerChess.getHealth() == 0) {
                playerDeathStatus[playerChess.getIndex()] = true;
            }

            playerChessGroup.add(playerChess);
        } else {
            let aiChess;
            if ((chessId + 1) % 2 == 0) {
                aiChess = new CharacterSprite(this, xCord * 32, yCord * 32, CST.SPRITE.SKELETON, 1, 1, chessId).setOrigin(0, 0);
                aiChess.enemyStatInit(aiChess, "Skeleton");
            } else {
                aiChess = new CharacterSprite(this, xCord * 32, yCord * 32, CST.SPRITE.MAGE, 1, 1, chessId).setOrigin(0, 0);
                aiChess.enemyStatInit(aiChess, "Mage");
            }
            aiChess.setInteractive();
            aiChess.rewindInit(parseInt(health), parseInt(xCord), parseInt(yCord));
            if (aiChess.getHealth() == 0) {
                aiDeathStatus[aiChess.getIndex() - 5] = true;
            }
            aiChessGroup.add(aiChess);
        }
    }

    // Functions that interact with blockchain
    // Initialize the match record when match starts
    matchStart() {
        // Tell the contract that the game is started
        if (mode == "New") {
            let chessId = [];
            let chessType = [];
            let weaponType = [];
            let attack = [];
            let defense = [];
            playerChessGroup.getChildren().forEach(chess => {
                chessId.push(chess.getIndex());
                chessType.push(chess.getChessType());
                weaponType.push(chess.getWeaponType());
                attack.push(chess.getAttack());
                defense.push(chess.getDefense());
            })
            aiChessGroup.getChildren().forEach(chess => {
                chessId.push(chess.getIndex());
                chessType.push(chess.getChessType());
                weaponType.push(chess.getWeaponType());
                attack.push(chess.getAttack());
                defense.push(chess.getDefense());
            })
            this.emitter.emit("matchStart", chessId, chessType, weaponType, attack, defense);
        }
    }

    // Update the round record after each round
    updateRoundRecord(turnNumber) {
        if (mode == "New" || mode == "Rewind(New)") {
            let chessId = [];
            let health = [];
            let xCord = [];
            let yCord = [];
            playerChessGroup.getChildren().forEach(chess => {
                chessId.push(chess.getIndex());
                health.push(chess.getHealth());
                xCord.push(chess.getPositionX());
                yCord.push(chess.getPositionY());
            })
            aiChessGroup.getChildren().forEach(chess => {
                chessId.push(chess.getIndex());
                health.push(chess.getHealth());
                xCord.push(chess.getPositionX());
                yCord.push(chess.getPositionY());
            })
            if (turnNumber % 2 == 1) {
                this.emitter.emit("transmitData",
                    this.aiOpponent.getAttackable(), this.aiOpponent.getHealthLeft(), this.aiOpponent.getDamageTo(),
                    this.aiOpponent.getRoundToDeath_1(), this.aiOpponent.getRoundToKill_1(), this.aiOpponent.getChosen(),
                    this.aiOpponent.getGRULocation(), this.aiOpponent.getRoundToDeath_2(), this.aiOpponent.getRoundToKill_2());
            }
            this.emitter.emit("roundEnd", matchNumber, turnNumber, chessId, health, xCord, yCord);
            this.aiOpponent.clearData();
        }
    }

    // Announce the result to player and blockchain
    showResult(winner) {
        switch (winner) {
            case "Player":
                if (mode == "New" || mode == "Rewind(New)") {
                    // Transmit the result and match record to blockchain
                    this.transmitMatchData(true);
                }
                this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, CST.IMAGE.WIN);
                this.showEndingButton();
                break;
            case "AI":
                if (mode == "New" || mode == "Rewind(New)") {
                    // Transmit the result and match record to blockchain
                    this.transmitMatchData(false);
                }
                this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, CST.IMAGE.LOSE);
                this.showEndingButton();
                break;
        }
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
            // Record action for rewind
            this.recorder.updateActionRecord(selectedChess, turnNumber, "Wait", null);

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

    transmitMatchData(result) {
        let collectibleIDs = [];
        let pointsEarned = [];
        playerChessGroup.getChildren().forEach(chess => {
            if (chess.getWeaponID() !== 0) {
                collectibleIDs.push(chess.getWeaponID());
                pointsEarned.push(chess.getKills());
            }
            if (chess.getArmorID() !== 0) {
                collectibleIDs.push(chess.getArmorID());
                pointsEarned.push(chess.getDefendPoint());
            }
        })
        this.emitter.emit("matchEnd", matchNumber, result, collectibleIDs, pointsEarned);
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
            this.scene.stop();
            this.scene.start(CST.SCENES.MENU);
        })
    }

    handleClick() {
        this.sound.play(CST.AUDIO.CLICK);
    }

    // Local game operate functions
    unlockPlayer(player) {
        switch (player) {
            case "Player":
                playerChessGroup.getChildren().forEach(chessChild => {
                    if (!chessChild.statusCheck("Dead"))
                        chessChild.isNewTurn();
                    playerChessStatus[chessChild.getIndex()] = chessChild.statusCheck("Finish");
                })
                break;
            case "AI":
                // Unlock AI chess then activate game learning AI
                let aiInAction = this.add.group();
                aiChessGroup.getChildren().forEach(chessChild => {
                    chessChild.isNewTurn();
                    if (!chessChild.statusCheck("Dead")) {
                        aiInAction.add(chessChild);
                    }
                });
                let i = 0;
                console.log("AI chess action size: " + aiInAction.getLength());
                if (aiInAction.getLength() == 0) {
                    this.showResult("Player");
                } else {
                    let aiActionSeq = aiInAction.getChildren();
                    this.time.addEvent({
                        delay: 2500,
                        callback: async () => {
                            if (!aiActionSeq[i].statusCheck("Finish") && !aiActionSeq[i].statusCheck("Dead")) {
                                await this.aiOpponent.aiMove(aiActionSeq[i], playerChessGroup);
                            }

                            if (i == aiInAction.getLength() - 1) {
                                if (mode == "New" || mode == "Rewind(New)")
                                    this.updateRoundRecord(turnNumber);
                                else if (mode == "Rewind")
                                    this.turnControl();
                            }
                            i++;
                        },
                        repeat: aiInAction.getLength() - 1
                    });
                }
                break;
        }
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
        playerChessGroup.getChildren().forEach(chessChild => {
            if (targetX == chessChild.x / 32 && targetY == chessChild.y / 32)
                overlay = true;
        })
        aiChessGroup.getChildren().forEach(chessChild => {
            if (targetX == chessChild.x / 32 && targetY == chessChild.y / 32)
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
    pathFinding(sprite) {
        this.finder.findPath(sprite.x / 32, sprite.y / 32, snappedWorldPoint.x / 32, snappedWorldPoint.y / 32, (path) => {
            sprite.updatePosition(snappedWorldPoint.x / 32, snappedWorldPoint.y / 32);
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
        if (sprite.getChessType() == "Human")
            switch (sprite.getWeaponType()) {
                case "Unarmed":
                    sprite.anims.play("human_walk");
                    break;
                case "Sword":
                    sprite.anims.play("human_sword_walk");
                    break;
                case "Bow":
                    sprite.anims.play("human_bow_walk");
                    break;
            }
        else
            switch (sprite.getChessType()) {
                case "Skeleton":
                    sprite.anims.play("skeleton_walk");
                    break;
                case "Mage":
                    sprite.anims.play("mage_walk");
                    break;
            }
    }

    switchAttackAni(target, weaponType) {
        let effect;
        effect = this.add.sprite(target.x, target.y, CST.SPRITE.ATTACKEFFECT).setDepth(1).setOrigin(0, 0);
        effect.anims.play("attackEffect");
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                effect.destroy();
            }
        });
        switch (weaponType) {
            case "Sword":
                this.sound.play(CST.AUDIO.SWORD, { volume: 0.3 });
                break;
            case "Bow":
                this.sound.play(CST.AUDIO.ARROW, { volume: 0.3 });
                break;
            case "Fireball":
                this.sound.play(CST.AUDIO.FIREBALL, { volume: 0.3 });
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

export default SinglePlayScene;