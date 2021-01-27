class MatchRecord {
    constructor() {
        this.chess = {};
        this.actionList = [];
    }

    initializeMatch(sprite) {
        this.chess[sprite.getIndex()] = {
            roundNumber: 0,
            chessType: sprite.getChessType(),
            weaponType: sprite.getWeaponType(),
            attack: sprite.getAttack(),
            defense: sprite.getDefense(),
            health: [],
            xCord: [],
            yCord: []
        };
    }

    updateRecord(sprite) {
        this.chess[sprite.getIndex()].roundNumber += 1;
        this.chess[sprite.getIndex()].health.push(sprite.getHealth());
        this.chess[sprite.getIndex()].xCord.push(sprite.getPositionX());
        this.chess[sprite.getIndex()].yCord.push(sprite.getPositionY());
    }

    // For easy rewind
    updateActionRecord(sprite, number, action, target) {
        let record = {};
        if (action == "Move") {
            record = {
                chessIndex: sprite.getIndex(),
                roundNum: number,
                action: action,
                // Previous location
                xCord: sprite.getPositionX(),
                yCord: sprite.getPositionY(),
            };
        } else if (action == "Attack") {
            record = {
                chessIndex: sprite.getIndex(),
                roundNum: number,
                action: action,
                target: target.getIndex(),
                // Previous health
                target_health: target.getHealth()
            };
        } else if (action == "Wait") {
            record = {
                chessIndex: sprite.getIndex(),
                roundNum: number,
                action: action,
                moveStatus: sprite.statusCheck("Move"),
                attackStatus: sprite.statusCheck("Attack")
            };
        }
        this.actionList.push(record);
    }

    roundRewind(playerChessGroup, aiChessGroup) {
        console.log(this.actionList[this.actionList.length - 1]);
        if (this.actionList[this.actionList.length - 1]) {
            let roundNum = this.actionList[this.actionList.length - 1].roundNum;
            let record;
            let playerSet = playerChessGroup.getChildren();
            let aiSet = aiChessGroup.getChildren();
            if (roundNum % 2 == 1) {
                record = this.actionList[this.actionList.length - 1];
                playerSet.forEach(chess => {
                    if (chess.getIndex() == record.chessIndex) {
                        switch (record.action) {
                            case "Move":
                                chess.rewindMove(record.xCord, record.yCord);
                                break;
                            case "Attack":
                                chess.rewindAttack(aiSet[record.target-5], record.target_health);
                                break;
                            case "Wait":
                                chess.rewindWait(record.moveStatus, record.attackStatus);
                                break;
                        }
                    }
                })
                this.actionList.pop(record);
                return roundNum;
            } else {
                while (this.actionList[this.actionList.length - 1].roundNum % 2 == 0) {
                    record = this.actionList[this.actionList.length - 1];
                    aiSet.forEach(chess => {
                        if (chess.getIndex() == record.chessIndex) {
                            switch (record.action) {
                                case "Move":
                                    chess.rewindMove(record.xCord, record.yCord);
                                    break;
                                case "Attack":
                                    chess.rewindAttack(playerSet[record.target], record.target_health);
                                    break;
                            }
                        }
                    })
                    this.actionList.pop(record);
                }
                record = this.actionList[this.actionList.length - 1];
                playerSet.forEach(chess => {
                    chess.roundRewind();
                    if (chess.getIndex() == record.chessIndex) {
                        switch (record.action) {
                            case "Move":
                                chess.rewindMove(record.xCord, record.yCord);
                                break;
                            case "Attack":
                                chess.rewindAttack(aiSet[record.target], record.target_health);
                                break;
                            case "Wait":
                                chess.rewindWait(record.moveStatus, record.attackStatus);
                                break;
                        }
                    }
                })
                this.actionList.pop(record);
                return roundNum - 2;
            }
        } else {
            console.log("No action taken");
        }
    }

}

export default MatchRecord;