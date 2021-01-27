import Phaser from "phaser";
import EventDispatcher from "./EventDispatcher";
import brain from "brain.js";

// Singleton structure
let instance = null;

class AI {
    constructor() {
        if (instance == null) {
            instance = this;
        }

        this.emitter = EventDispatcher.getInstance();

        this.moveNetwork = new brain.recurrent.GRUTimeStep();
        this.attackNetwork = new brain.NeuralNetwork();

        // Attack action parameters
        this.isTargetAttackable = [];
        this.enemyHealthLeft = [];
        this.damageToTarget = [];
        this.roundToDeath_1 = [];
        this.roundToKill_1 = [];
        this.chosenTarget = [];

        /*
            Move action parameters
            Contains 19 data
            First 15 are the x-coordinate, y-coordinate and winning probability against each enemy 
            Last four are the current x-coordinate, current y-coordinate,
            new x-coordinate and new y-coordinate the chess has moved to
        */
        this.GRULocation = [];
        this.roundToDeath_2 = [];
        this.roundToKill_2 = [];

        this.moveAIstat = "Not Trained";
        
        this.setEventListeners();

        // Sample data training for AI to avoid first match crashes
        this.attackNetwork.train([
            { input: { attackable: false, healthPercentage: 90, damageDeal: 5, winProb: 2.5 }, output: { ignore: 1 } },
            { input: { attackable: true, healthPercentage: 80, damageDeal: 27, winProb: 0.1 }, output: { attack: 1 } },
            { input: { attackable: false, healthPercentage: 5, damageDeal: 24, winProb: 3.8 }, output: { ignore: 1 } },
            { input: { attackable: true, healthPercentage: 24, damageDeal: 12, winProb: 0.12 }, output: { ignore: 1 } },
            { input: { attackable: true, healthPercentage: 99, damageDeal: 9, winProb: 0.23 }, output: { attack: 1 } },
            { input: { attackable: true, healthPercentage: 29, damageDeal: 27, winProb: 0.57 }, output: { ignore: 1 } },
        ]);
    }

    static getInstance() {
        if (instance == null) {
            instance = new AI();
        }
        return instance;
    }

    setEventListeners() {
        this.emitter.on("receiveMoveData", this.trainMove.bind(this))
        this.emitter.on("receiveAttackData", this.trainAttack.bind(this));
    }

    getAttackable() {
        return this.isTargetAttackable;
    }

    getHealthLeft() {
        return this.enemyHealthLeft;
    }

    getDamageTo() {
        return this.damageToTarget;
    }

    getRoundToDeath_1() {
        return this.roundToDeath_1;
    }

    getRoundToKill_1() {
        return this.roundToKill_1;
    }

    getChosen() {
        return this.chosenTarget;
    }

    getGRULocation() {
        return this.GRULocation;
    }

    getRoundToDeath_2() {
        return this.roundToDeath_2;
    }

    getRoundToKill_2() {
        return this.roundToKill_2;
    }

    // For AI training, only activate once per start of match
    trainMove(_GRULocation, _toDeath, _toKill) {
        this.moveAIstat = "Trained";
        let count1 = 0;
        let count2 = 0;
        let _GRUProb = [];
        for (let i = 0; i < _toDeath.length; i++) {
            let roundToKill = parseInt(_toKill[i]);
            if (roundToKill == 0) {
                _GRUProb[i] = 0;
            } else {
                _GRUProb[i] = parseInt(_toDeath[i]) / parseInt(_toKill[i]);
            }
        }
        let _GRULocationProb = [];
        for (let i = 0; i < _GRULocation.length; i++) {
            _GRULocationProb[i] = parseInt(_GRULocation[i]);
        }

        this.moveNetwork.train([[_GRULocationProb[count1 + 0], _GRULocationProb[count1 + 1], _GRUProb[count2 + 0],
        _GRULocationProb[count1 + 2], _GRULocationProb[count1 + 3], _GRUProb[count2 + 1],
        _GRULocationProb[count1 + 4], _GRULocationProb[count1 + 5], _GRUProb[count2 + 2],
        _GRULocationProb[count1 + 6], _GRULocationProb[count1 + 7], _GRUProb[count2 + 3],
        _GRULocationProb[count1 + 8], _GRULocationProb[count1 + 9], _GRUProb[count2 + 4],
        _GRULocationProb[count1 + 10], _GRULocationProb[count1 + 11], _GRULocationProb[count1 + 12], _GRULocationProb[count1 + 13]]], {
            iterations: 50,
            timeout: 1000
        });
        count1 += 14;
        count2 += 5;
        console.log("Move Trained");

    }

    trainAttack(_true, _enemyHealthLeft, _damageToTarget, _toDeath, _toKill, _chosenTarget) {
        // Have to convert the retrieved data from string into int
        let attackableArray = _true;
        let healthArray = [];
        let damageArray = [];
        let winningArray = [];
        for (let i = 0; i < 5; i++) {
            healthArray.push(parseInt(_enemyHealthLeft[i]));
            damageArray.push(parseInt(_damageToTarget[i]));
            let roundToKill = parseInt(_toKill[i]);
            if (roundToKill == 0) {
                winningArray[i] = 0;
            } else {
                winningArray.push(parseInt(_toDeath[i]) / parseInt(_toKill[i]))
            }

        }
        let target = ["ignore", "ignore", "ignore", "ignore", "ignore"];
        if (_chosenTarget != 5) {
            target[_chosenTarget] = "chosen";
        }

        for (let i = 0; i < 5; i++) {
            if (target[i] == "ignore") {
                this.attackNetwork.train({
                    input: { attackable: attackableArray[i], healthPercentage: healthArray[i], damageDeal: damageArray[i], winningProb: winningArray[i] },
                    output: { ignore: 1 }
                });
            } else if (target[i] == "chosen") {
                this.attackNetwork.train({
                    input: { attackable: attackableArray[i], healthPercentage: healthArray[i], damageDeal: damageArray[i], winningProb: winningArray[i] },
                    output: { attack: 1 }
                });
            }
            console.log("Attack Trained");
        }
    }

    // Save player's move and attack decision
    saveMoveChoice(selectedChess, enemyGroup, previousX, previousY) {
        enemyGroup.getChildren().forEach(enemy => {
            this.GRULocation.push(enemy.getPositionX());
            this.GRULocation.push(enemy.getPositionY());

            /*
                Calculate the winning probability (Survivability) of the selected chess against enemy
                Factors that affect the probability:
                1. Current health of selected chess
                2. Current health of enemy
                3. Damage taken by selected chess if encounters enemy
                4. Damage deal to enemy
            */

            let damageDeal = selectedChess.getAttack() - enemy.getDefense();
            if (damageDeal <= 0) {
                damageDeal = 1;
            }
            let damageTaken = enemy.getAttack() - selectedChess.getDefense();
            if (damageTaken <= 0) {
                damageTaken = 1;
            }
            let roundToKill = Math.ceil(enemy.getHealth() / damageDeal);
            let roundToDeath = Math.ceil(selectedChess.getHealth() / damageTaken);
            this.roundToKill_2.push(roundToKill);
            this.roundToDeath_2.push(roundToDeath);
        })
        this.GRULocation.push(previousX);
        this.GRULocation.push(previousY);
        this.GRULocation.push(selectedChess.getPositionX());
        this.GRULocation.push(selectedChess.getPositionY());
    }

    saveAttackChoice(selectedChess, selectedTarget, enemyGroup) {
        /*
            Input
            1a. In move+attack Range
            2. Health left percentage
            3. Damage deal
            4. Winning Prob (Round to death / Round to kill)
            Output
            1. Attack
            2. Ignore
        */
        enemyGroup.getChildren().forEach(enemy => {
            this.calculateAttackData(selectedChess, enemy);
            if (enemy == selectedTarget) {
                this.chosenTarget.push(selectedTarget.getIndex() - 5);
            }
        })
    }

    aiMove = async (selectedChess, enemyGroup) => {
        let GRUData = [];
        let resultX;
        let resultY;
        if (this.moveAIstat == "Trained") {
            // Find desire location according to player's move pattern
            await enemyGroup.getChildren().forEach(enemy => {
                GRUData.push(enemy.getPositionX());
                GRUData.push(enemy.getPositionY());
                let damageDeal = selectedChess.getAttack() - enemy.getDefense();
                let damageTaken = enemy.getAttack() - selectedChess.getDefense();
                let roundToKill = Math.ceil(enemy.getHealth() / damageDeal);
                let roundToDeath = Math.ceil(selectedChess.getHealth() / damageTaken);
                if (enemy.getAttackRange() > selectedChess.getAttackRange()) {
                    roundToDeath--;
                } else if (enemy.getAttackRange() < selectedChess.getAttackRange()) {
                    roundToKill--;
                }
                let surviProb = roundToDeath / roundToKill;
                GRUData.push(surviProb);
            })
            GRUData.push(selectedChess.getPositionX());
            GRUData.push(selectedChess.getPositionY());

            resultX = await this.moveNetwork.run(GRUData);
            GRUData.push(Math.round(resultX));
            resultY = await this.moveNetwork.run(GRUData);
            GRUData.push(Math.round(resultY));
        }
        if (Number.isNaN(resultX) || Number.isNaN(resultY) || this.moveAIstat == "Not Trained") {
            console.log("NaN received");
            // If desire location not found, go to nearest enemy
            let closestTarget;
            let closestDistance = 100;
            enemyGroup.getChildren().forEach(enemy => {
                let dis = Phaser.Math.Distance.Between(selectedChess.getPositionX(), selectedChess.getPositionY(), enemy.getPositionX(), enemy.getPositionY());
                if (dis <= closestDistance) {
                    closestDistance = dis;
                    closestTarget = enemy;
                }
            });
            this.emitter.emit("aiFindPath", selectedChess, closestTarget.getPositionX(), closestTarget.getPositionY());
        } else {
            this.emitter.emit("aiFindPath", selectedChess, Math.round(resultX), Math.round(resultY));
        }
        this.clearData();
    }

    aiAttack = async (selectedChess, enemyGroup) => {

        // Find desire target according to player's attack pattern
        await enemyGroup.getChildren().forEach(enemy => {
            this.calculateAttackData(selectedChess, enemy);
        })
        let target;
        let maxProb = 0;
        let winningProb = [];
        for (let i = 0; i < 5; i++) {

            winningProb[i] = this.roundToDeath_1[i] / this.roundToKill_1[i];

            let result = await this.attackNetwork.run({ input: [this.isTargetAttackable[i], this.enemyHealthLeft[i], this.damageToTarget[i], winningProb[i]] });
            if (result.attack > maxProb) {
                maxProb = result.attack;
                target = i;
            }
        }
        let playerSet = enemyGroup.getChildren();
        this.emitter.emit("aiFindTarget", selectedChess, playerSet[target]);
        this.clearData();
    }

    // Data calculation
    calculateAttackData(selectedChess, enemy) {
        // Calculate distance to all 5 player's chess
        let dis = Phaser.Math.Distance.Between(selectedChess.getPositionX(), selectedChess.getPositionY(), enemy.getPositionX(), enemy.getPositionY());
        if (dis > (selectedChess.getMoveRange() + selectedChess.getAttackRange())) {
            this.isTargetAttackable.push(false);
        } else {
            this.isTargetAttackable.push(true);
        }
        // Update chess's current health and damage to target
        this.enemyHealthLeft.push(Math.round((enemy.getHealth() / enemy.getMaxHealth()) * 100));
        if (selectedChess.getAttack() - enemy.getDefense() > 0) {
            this.damageToTarget.push(selectedChess.getAttack() - enemy.getDefense());
        } else {
            this.damageToTarget.push(1);
        }
        let damageDeal = selectedChess.getAttack() - enemy.getDefense();
        if (damageDeal <= 0) {
            damageDeal = 1;
        }
        let damageTaken = enemy.getAttack() - selectedChess.getDefense();
        if (damageTaken <= 0) {
            damageTaken = 1;
        }
        let roundToKill = Math.ceil(enemy.getHealth() / damageDeal);
        let roundToDeath = Math.ceil(selectedChess.getHealth() / damageTaken);
        this.roundToKill_1.push(roundToKill);
        this.roundToDeath_1.push(roundToDeath);
    }

    // Clear data after each round or AI decision
    clearData() {
        this.isTargetAttackable = [];
        this.enemyHealthLeft = [];
        this.damageToTarget = [];
        this.roundToDeath_1 = [];
        this.roundToKill_1 = [];
        this.chosenTarget = [];

        this.GRULocation = [];
        this.roundToDeath_2 = [];
        this.roundToKill_2 = [];
    }
}

export default AI;