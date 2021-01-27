pragma solidity ^0.5.2;

contract Learning {
    event moveChoice(
        address indexed playerId,
        uint8[14] GRULocation,
        uint8[5] toDeath,
        uint8[5] toKill
    );

    // event attackChoice(address indexed playerId, bool[5] isTargetAttackable, uint[5] enemyHealthLeft, uint[5] damageToTarget, uint[5] toDeath, uint[5] toKill, uint chosenTarget);

    function saveMove() public {
        uint8[14] memory GRULocation = [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14
        ];
        uint8[5] memory toDeath = [5, 5, 5, 5, 5];
        uint8[5] memory toKill = [4, 6, 4, 6, 4];
        emit moveChoice(msg.sender, GRULocation, toDeath, toKill);
    }
}
