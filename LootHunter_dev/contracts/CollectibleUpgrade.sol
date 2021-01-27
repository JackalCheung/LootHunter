pragma solidity ^0.5.2;
import "./safemath.sol";
import "./CollectibleFactory.sol";

contract CollectibleUpgrade is CollectibleFactory {
    using SafeMath for uint256;

    event updateSpecialisation(
        uint256 collectibleId,
        uint256 latestSpecialisation
    );
    event upgradeWeapon(
        uint256 collectibleId,
        uint256 latestLevel,
        uint256 latestAttribute
    );
    event upgradeArmor(
        uint256 collectibleId,
        uint256 latestLevel,
        uint256 latestAttribute
    );

    modifier onlyOwnerOf(uint256 _collectibleId) {
        require(msg.sender == collectibleToOwner[_collectibleId]);
        _;
    }

    modifier killCountOver(uint256 _collectibleId) {
        require(
            (collectibles[_collectibleId].specialisationCount / 10) >=
                collectibles[_collectibleId].itemLevel
        );
        _;
    }

    modifier survivalPointOver(uint256 _survivalPoint) {
        require(_survivalPoint >= 10);
        _;
    }

    function specialisationAdd(
        uint8[] memory _collectibleId,
        uint8[] memory _specialisationPoint
    ) public {
        for (uint256 i = 0; i < _collectibleId.length; i++) {
            collectibles[_collectibleId[i]]
                .specialisationCount = collectibles[_collectibleId[i]]
                .specialisationCount
                .add(_specialisationPoint[i]);
            emit updateSpecialisation(
                _collectibleId[i],
                collectibles[_collectibleId[i]].specialisationCount
            );
            if (collectibles[_collectibleId[i]].itemType < 2) {
                weaponLevelUp(_collectibleId[i]);
            } else {
                armorLevelUp(_collectibleId[i], _specialisationPoint[i]);
            }
        }
    }

    /*
        Weapon Level Up Rules:
        Every 10 kills give +3 attack
    */
    function weaponLevelUp(uint256 _collectibleId)
        internal
        killCountOver(_collectibleId)
    {
        collectibles[_collectibleId].itemLevel = collectibles[_collectibleId]
            .itemLevel
            .add(1);
        collectibles[_collectibleId]
            .itemAttribute = collectibles[_collectibleId].itemAttribute.add(3);
        emit upgradeWeapon(
            _collectibleId,
            collectibles[_collectibleId].itemLevel,
            collectibles[_collectibleId].itemAttribute
        );
    }

    /*
        Armor Level Up Rules:
        Survived from more than 10 attacks in a match has a chance to level up armor
        _survivalPoint = attacks taken from enemy, each attack +1
    */
    function armorLevelUp(uint256 _collectibleId, uint256 _survivalPoint)
        internal
        survivalPointOver(_survivalPoint)
    {
        if (super.randMod(100) > 70) {
            collectibles[_collectibleId]
                .itemLevel = collectibles[_collectibleId].itemLevel.add(1);
            collectibles[_collectibleId]
                .itemAttribute = collectibles[_collectibleId].itemAttribute.add(
                3
            );
            emit upgradeArmor(
                _collectibleId,
                collectibles[_collectibleId].itemLevel,
                collectibles[_collectibleId].itemAttribute
            );
        }
    }
}
