import Phaser from "phaser";
import EventDispatcher from "./EventDispatcher";

class CharacterSprite extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, frame, _ownerIndex, _index) {
        super(scene, x, y, texture, frame);
        scene.sys.updateList.add(this);
        scene.sys.displayList.add(this);
        this.setOrigin(1, 1);
        scene.physics.world.enableBody(this);
        this.setImmovable(true);

        // Event emitter
        this.emitter = EventDispatcher.getInstance();
        // Image setting
        this.frameWidth = 32;
        this.frameHeight = 32;
        // Tile position
        this.currentX = x / 32;
        this.currentY = y / 32;

        // Which player owns this chess
        this.ownerIndex = _ownerIndex;
        // Chess setting
        this.chessType = "Human";
        this.index = _index;
        this.currentItemLevel = 0;
        this.health = 10;
        this.currentHealth = 10;
        this.attack = 1;
        this.defense = 0;
        this.attackRange = 1;
        this.moveRange = 3;

        // Equip status - avoid multiple items equipped at same slot
        this.weaponID = 0;
        this.weaponEquipped = false;
        this.weaponType = "Unarmed";
        this.armorID = 0;
        this.armorEquipped = false;
        // Action status - every chess can only move and attack for once in each turn
        this.isMoved = true;
        this.isAttacked = true;
        this.isFinished = true;
        // Death status - once killed, no action can be performed anymore
        this.isDead = false;

        // For level up
        this.kills = 0;
        this.defendPoint = 0;
    }

    // Initialize the statistics for player's chess after equpping items or rewind
    baseStatInit(_type, _attack, _defense, _level) {
        if (_type != "Unarmed") {
            this.weaponType = _type;
            this.weaponEquipped = true;
            if (_type == "Bow") {
                this.attackRange = 3;
            }
        }
        this.attack = _attack;
        this.defense = _defense;
        this.currentItemLevel = _level;
    }

    // Initialize the statistics for AI's chess
    enemyStatInit(sprite, chessType) {
        switch (chessType) {
            case "Skeleton": {
                sprite.chessType = "Skeleton";
                sprite.health = 5;
                sprite.currentHealth = 5;
                sprite.attack = 3;
                sprite.defense = 3;
                sprite.attackRange = 1;
                sprite.moveRange = 3;
                sprite.weaponEquipped = true;
                sprite.weaponType = "Sword";
                sprite.armorEquipped = true;
                break;
            }
            case "Mage": {
                sprite.chessType = "Mage";
                sprite.health = 5;
                sprite.currentHealth = 5;
                sprite.attack = 5;
                sprite.defense = 1;
                sprite.attackRange = 3;
                sprite.moveRange = 2;
                sprite.weaponEquipped = true;
                sprite.weaponType = "Fireball";
                sprite.armorEquipped = true;
            }
        }
    }

    // Rewind the chess's health and position at that round
    rewindInit(_health, _xCord, _yCord) {
        this.currentHealth = _health;
        if (this.currentHealth != 0) {
            this.currentX = _xCord;
            this.currentY = _yCord;
            this.x = _xCord * 32;
            this.y = _yCord * 32;
        } else {
            this.isDead = true;
            this.currentX = _xCord;
            this.currentY = _yCord;
            this.x = -1 * 32;
            this.y = -1 * 32;
        }
    }

    // Return data for game front-end
    getPositionX() {
        return this.currentX;
    }

    getPositionY() {
        return this.currentY;
    }

    getOwnerIndex() {
        return this.ownerIndex;
    }

    getChessType() {
        return this.chessType;
    }

    getIndex() {
        return this.index;
    }

    getMaxHealth() {
        return this.health;
    }

    getHealth() {
        return this.currentHealth;
    }

    getWeaponType() {
        return this.weaponType;
    }

    getAttack() {
        return this.attack;
    }

    getDefense() {
        return this.defense;
    }

    getMoveRange() {
        return this.moveRange;
    }

    getAttackRange() {
        return this.attackRange;
    }

    getWeaponID() {
        return this.weaponID;
    }

    getKills() {
        return this.kills;
    }

    getArmorID() {
        return this.armorID;
    }

    getDefendPoint() {
        return this.defendPoint;
    }

    // Return its status for decision making
    statusCheck(action) {
        switch (action) {
            case "Attack":
                return this.isAttacked;
            case "Move":
                return this.isMoved;
            case "Finish":
                return this.isFinished;
            case "Dead":
                return this.isDead;
        }
    }

    equipStatus(type) {
        switch (type) {
            case "Sword":
                return this.weaponEquipped;
            case "Bow":
                return this.weaponEquipped;
            case "Armor":
                return this.armorEquipped;
        }
    }

    // Change action status after performing actions
    performAction(action) {
        switch (action) {
            case "Attack":
                this.isAttacked = true;
                this.isTurnFinished();
                break;
            case "Move":
                this.isMoved = true;
                this.isTurnFinished();
                break;
            case "Wait":
                this.isMoved = true;
                this.isAttacked = true;
                this.isTurnFinished();
                break;
        }
    }

    // Update the current position of the chess
    updatePosition(positionX, positionY) {
        this.currentX = positionX;
        this.currentY = positionY;
    }

    // Being attacked by enemy chess
    getHit(attacker) {
        this.currentHealth -= attacker.getAttack();
        this.defendPoint++;
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.isDead = true;
            attacker.getKills();
            this.emitter.emit("clearChess", this);
            this.emitter.emit("statusUpdate", "Dead", this.index, this.isDead);
        }
        return this.isDead;
    }

    getKills() {
        this.kills++;
    }

    // Check whether the chess performed all available actions
    isTurnFinished() {
        if (this.isMoved && this.isAttacked) {
            this.isFinished = true;
            this.emitter.emit("statusUpdate", "Finish", this.index, this.isFinished);
        }
        return this.isFinished;
    }

    // Change action status when new turn starts
    isNewTurn() {
        if (!this.statusCheck("Dead")) {
            this.isFinished = false;
            this.isMoved = false;
            this.isAttacked = false;
        }
    }

    // Equip weapon or armor, update character's statistics
    equipItem(itemID, itemType, itemStat, itemLevel) {
        this.currentItemLevel += itemLevel;
        switch (itemType) {
            case "Sword": {
                this.weaponType = itemType;
                this.attackRange = 1;
                this.attack += itemStat;
                this.weaponID = itemID;
                this.weaponEquipped = true;
                break;
            }
            case "Bow": {
                this.weaponType = itemType;
                this.attackRange = 3;
                this.attack += itemStat;
                this.weaponID = itemID;
                this.weaponEquipped = true;
                break;
            }
            case "Armor": {
                this.defense += itemStat;
                this.armorID = itemID;
                this.armorEquipped = true;
                break;
            }
        }
        this.updateItemLevel(this.currentItemLevel);
    }

    // Un-equip weapon or armor, update character's statistics
    unequipItem(itemType, itemLevel) {
        this.currentItemLevel -= itemLevel;
        if (itemType === "Sword" || itemType === "Bow") {
            this.attackRange = 1;
            this.attack = 1;
            this.weaponID = 0;
            this.weaponEquipped = false;
        } else if (itemType === "Armor") {
            this.defense = 0;
            this.armorID = 0;
            this.armorEquipped = false;
        }
        this.updateItemLevel(this.currentItemLevel);
    }

    // Character's health changes depend on the item level
    updateItemLevel(currentItemLevel) {
        switch (currentItemLevel) {
            case (currentItemLevel > 1 && currentItemLevel <= 5): {
                this.health = 10;
                this.currentHealth = 10;
                break;
            }
            case (currentItemLevel > 5 && currentItemLevel <= 10): {
                this.health = 15;
                this.currentHealth = 15;
                break;
            }
            case (currentItemLevel > 10 && currentItemLevel <= 15): {
                this.health = 20;
                this.currentHealth = 20;
                break;
            }
            case (currentItemLevel > 15 && currentItemLevel <= 20): {
                this.health = 25;
                this.currentHealth = 25;
                break;
            }
            case (currentItemLevel > 20): {
                this.health = 30;
                this.currentHealth = 30;
                break;
            }
        }
    }

    // Rewind action
    roundRewind() {
        if (!this.statusCheck("Dead")) {
            this.isMoved = true;
            this.isAttacked = true;
            this.isFinished = true;
        }
    }
    rewindMove(previousX, previousY) {
        this.x = previousX * 32;
        this.y = previousY * 32;
        this.currentX = previousX;
        this.currentY = previousY;
        this.isMoved = false;
        this.isFinished = false;
    }

    rewindAttack(sprite, sprite_health) {
        this.isAttacked = false;
        this.isFinished = false;
        if (sprite.statusCheck("Dead")) {
            this.kills -= 1;
        }
        sprite.rewindFromAttack(sprite_health);
    }

    rewindFromAttack(sprite_health) {
        if (this.statusCheck("Dead")) {
            this.isDead = false;
            this.x = this.currentX * 32;
            this.y = this.currentY * 32;
        }
        this.currentHealth = sprite_health;
    }

    rewindWait(moveStatus, attackStatus) {
        this.isMoved = moveStatus;
        this.isAttacked = attackStatus;
        this.isFinished = false;
    }
}

export default CharacterSprite;