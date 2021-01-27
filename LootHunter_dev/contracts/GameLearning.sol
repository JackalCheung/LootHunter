pragma solidity ^0.5.2;

contract GameLearning {
    event moveChoice(
        address indexed playerId,
        uint8[14] GRULocation,
        uint8[5] toDeath,
        uint8[5] toKill
    );
    event attackChoice(
        address indexed playerId,
        bool[5] isTargetAttackable,
        uint8[5] enemyHealthLeft,
        uint8[5] damageToTarget,
        uint8[5] toDeath,
        uint8[5] toKill,
        uint256 chosenTarget
    );

    function saveMoveData(
        uint8[] memory _location,
        uint8[] memory _toDeath,
        uint8[] memory _toKill
    ) public {
        uint256 count1 = 0;
        uint256 count2 = 0;
        for (uint256 i = 0; i < (_location.length / 14); i++) {
            uint8[14] memory locationData;
            for (uint256 j = 0; j < 14; j++) {
                locationData[j] = _location[count1 + j];
            }
            uint8[5] memory deathData;
            uint8[5] memory killData;
            for (uint256 j = 0; j < 5; j++) {
                deathData[j] = _toDeath[count2 + j];
                killData[j] = _toKill[count2 + j];
            }
            emit moveChoice(msg.sender, locationData, deathData, killData);
            count1 += 14;
            count2 += 5;
        }
    }

    function saveAttackData(
        bool[] memory _attackable,
        uint8[] memory _enemyHealthLeft,
        uint8[] memory _damageToTarget,
        uint8[] memory _toDeath,
        uint8[] memory _toKill,
        uint8[] memory _chosen
    ) public {
        uint256 count = 0;
        for (uint256 i = 0; i < _chosen.length; i++) {
            bool[5] memory attackable;
            uint8[5] memory health;
            uint8[5] memory damage;
            uint8[5] memory deathData;
            uint8[5] memory killData;
            for (uint256 j = 0; j < 5; j++) {
                attackable[j] = _attackable[count + j];
                health[j] = _enemyHealthLeft[count + j];
                damage[j] = _damageToTarget[count + j];
                deathData[j] = _toDeath[count + j];
                killData[j] = _toKill[count + j];
            }
            uint256 chosen = _chosen[i];
            emit attackChoice(
                msg.sender,
                attackable,
                health,
                damage,
                deathData,
                killData,
                chosen
            );
            count += 5;
        }
    }
}
