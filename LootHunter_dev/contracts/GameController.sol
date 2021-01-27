pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;
import "./safemath.sol";

contract GameController {
    using SafeMath for uint256;

    event chessInitialize(
        address indexed playerId,
        uint256 indexed matchIndex,
        uint256 indexed chessId,
        string chessType,
        string weaponType,
        uint256 attack,
        uint256 defense
    );
    event chessAction(
        address indexed playerId,
        uint256 indexed matchIndex,
        uint256 indexed roundNum,
        uint256 chessId,
        uint256 health,
        uint256 xCord,
        uint256 yCord
    );
    event announceResult(
        address indexed playerId,
        uint256 indexed matchIndex,
        string result
    );
    event gameRecord(
        address indexed playerId,
        uint256 winNumber,
        uint256 loseNumber
    );

    struct Chess {
        address owner;
        uint256 matchIndex;
        uint256 id;
        uint256 roundNum;
        string chessType;
        string weaponType;
        uint256 attack;
        uint256 defense;
        uint256[] health;
        uint256[] xCord;
        uint256[] yCord;
    }

    Chess[] public chess;

    mapping(address => uint256) playerMatchNumberCount;
    mapping(address => uint256) playerWinNumberCount;
    mapping(address => uint256) playerLoseNumberCount;
    mapping(uint256 => address) public chessToOwner;
    mapping(address => uint256) ownerChessCount;

    // Update the statistics of chess at the beginning of the match
    function initializeMatch(
        uint256[] memory _chessId,
        string[] memory _chessType,
        string[] memory _weaponType,
        uint256[] memory _attack,
        uint256[] memory _defense
    ) public {
        playerMatchNumberCount[msg.sender] = playerMatchNumberCount[msg.sender]
            .add(1);
        uint256 _matchIndex = playerMatchNumberCount[msg.sender];
        for (uint256 i = 0; i < 10; i++) {
            uint256 _id = chess.length++;
            chess[_id].owner = msg.sender;
            chess[_id].matchIndex = _matchIndex;
            chess[_id].id = _chessId[i];
            chess[_id].chessType = _chessType[i];
            chess[_id].weaponType = _weaponType[i];
            chess[_id].attack = _attack[i];
            chess[_id].defense = _defense[i];
            chessToOwner[_id] = msg.sender;
            ownerChessCount[msg.sender] = ownerChessCount[msg.sender].add(1);
            emit chessInitialize(
                msg.sender,
                _matchIndex,
                _chessId[i],
                _chessType[i],
                _weaponType[i],
                _attack[i],
                _defense[i]
            );
        }
    }

    // Update the status of chess per round
    function updateRoundRecord(
        uint256 _currentMatch,
        uint256 _roundNum,
        uint256[10] memory _chessId,
        uint256[10] memory _health,
        uint256[10] memory _xCord,
        uint256[10] memory _yCord
    ) public {
        uint256 _matchIndex = playerMatchNumberCount[msg.sender];
        if (_matchIndex != _currentMatch) {
            _matchIndex = _currentMatch;
        }
        uint256[] memory chessIDs = getChessId(msg.sender);
        for (uint256 i = 0; i < chessIDs.length; i++) {
            for (uint256 j = 0; j < 10; j++) {
                if (
                    chess[chessIDs[i]].owner == msg.sender &&
                    chess[chessIDs[i]].matchIndex == _matchIndex &&
                    chess[chessIDs[i]].id == _chessId[j]
                ) {
                    chess[chessIDs[i]].roundNum = _roundNum;
                    chess[chessIDs[i]].health.push(_health[j]);
                    chess[chessIDs[i]].xCord.push(_xCord[j]);
                    chess[chessIDs[i]].yCord.push(_yCord[j]);
                    emit chessAction(
                        msg.sender,
                        _matchIndex,
                        _roundNum,
                        _chessId[j],
                        _health[j],
                        _xCord[j],
                        _yCord[j]
                    );
                }
            }
        }
    }

    // Once the winner is determined in front-end, message will be sent and winner info will be published in the blockchain.
    function resultAnnounce(uint256 _currentMatch, bool _win) public {
        if (_win) {
            playerWinNumberCount[msg.sender] = playerWinNumberCount[msg.sender].add(1);
            emit announceResult(
                msg.sender,
                _currentMatch,
                "Win"
            ); // After emitting the event, the front-end will go into the result stage.
        } else {
            playerLoseNumberCount[msg.sender] = playerLoseNumberCount[msg.sender].add(1);
            emit announceResult(
                msg.sender,
                _currentMatch,
                "Lose"
            ); // After emitting the event, the front-end will go into the result stage.
        }
        emit gameRecord(
            msg.sender,
            playerWinNumberCount[msg.sender],
            playerLoseNumberCount[msg.sender]
        );
    }

    function getChessId(address _owner)
        internal
        view
        returns (uint256[] memory)
    {
        uint256[] memory result = new uint256[](ownerChessCount[_owner]);
        uint256 counter = 0;
        for (uint256 i = 0; i < chess.length; i++) {
            if (chessToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }

    function getMatchIndex(address _player) public view returns (uint256) {
        return playerMatchNumberCount[_player];
    }

    function getRoundIndex(uint256 _matchIndex) public view returns (uint256) {
        uint256[] memory result = getChessId(msg.sender);
        for (uint256 i = 0; i < result.length; i++) {
            if (chess[result[i]].matchIndex == _matchIndex) {
                return chess[result[i]].roundNum;
            }
        }
    }
}
