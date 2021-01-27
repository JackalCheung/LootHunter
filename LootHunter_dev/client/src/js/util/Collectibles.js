import Phaser from "phaser";
/* 
    Make a copy from the smart contract
    In order to make it easier to apply on the game
    Will automatically destory after the game
*/
class Collectibles extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        scene.sys.updateList.add(this);
        scene.sys.displayList.add(this);
        scene.physics.world.enableBody(this);
        this.setImmovable(true);

        this.id = 0;
        this.name = "";
        this.type = "";
        this.rareness = "";
        this.equipStatus = false;
        this.attribute = 0;
        this.itemLevel = 0;
        this.specialisationGained = 0;

    }

    // Receive collectible statistics from blockchain
    receiveItemData(_id, _name, _type, _rareness, _attribute, _itemLevel) {
        this.id = _id;
        this.name = _name;
        this.type = _type;
        this.rareness = _rareness;
        this.attribute = _attribute;
        this.itemLevel = _itemLevel;
    }

    // Return data for game front-end and blockchain
    getID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getType() {
        return this.type;
    }

    getRareness() {
        return this.rareness;
    }

    getStatus() {
        return this.equipStatus;
    }

    getAttribute() {
        return this.attribute;
    }

    getItemLevel() {
        return this.itemLevel;
    }

    getSpecialisationPoint() {
        return this.specialisationGained;
    }

    equippedOn(sprite, x, y) {
        this.previousX = this.x;
        this.previousY = this.y;
        this.x = x;
        if(this.type != "Armor") {
            this.y = y;
        } else {
            this.y = y + 70;
        }
        this.equippedChess = sprite;
        this.equipStatus = true;
    }

    equippedOff() {
        this.x = this.previousX;
        this.y = this.previousY;
        this.equippedChess = null;
        this.equipStatus = false;
    }
}

export default Collectibles;