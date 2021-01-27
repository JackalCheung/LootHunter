pragma solidity ^0.5.2;
import "./ownable.sol";
import "./safemath.sol";

contract CollectibleFactory is Ownable {
    
    using SafeMath for uint256;
    
    uint randNonce = 0;

    event newCollectible(uint collectibleId, uint itemType);
    
    struct Collectible {
        uint itemType;
        /* 3 item types for now
        0 - sword
        1 - bow
        2 - armor
        */
        uint itemRareness;
        /* 4 kinds of item rareness
        0 - normal
        1 - rare
        2 - epic
        3 - mythic
        */
        uint itemAttribute;
        uint itemLevel;
        uint specialisationCount;
        /* 
            killCount for weapon
            survivalPoint for armor
        */
    }
    
    Collectible[] public collectibles;
    
    mapping (uint => address) public collectibleToOwner;
    mapping (address => uint) ownerCollectibleCount;
    
    // When player wins a match, collectibles will be distributed to them
    function obtainCollectible(uint _numberOfCollectibles) public { 
        for(uint i = 0; i < _numberOfCollectibles; i++) {
            uint _type = typeGenerate();
            uint _rareness = rarenessGenerate();
            uint _attribute;
            if(_rareness == 0) 
                _attribute = 3;
            else if(_rareness == 1)
                _attribute = 5;
            else if(_rareness == 2)
                _attribute = 8;
            else if(_rareness == 3)
                _attribute = 10;
        
            uint _id = collectibles.push(Collectible(_type, _rareness, _attribute, 1, 0));
            collectibleToOwner[_id] = msg.sender;
            ownerCollectibleCount[msg.sender] = ownerCollectibleCount[msg.sender].add(1);
            emit newCollectible(_id, _type);
        }
    }
    
    function typeGenerate() internal view returns (uint) {
        return randMod(3);
    }
    
    function rarenessGenerate() internal view returns (uint) {
        uint randRareness = randMod(100);
        /*
        70% - normal
        20% - rare
        7% - epic
        3% - mythic
        */
        if(randRareness < 70) return 0; // 0 to 69 for normal
        else if(randRareness < 90) return 1; // 70 to 89 for rare
        else if(randRareness < 96) return 2; // 90 to 96 for epic
        else if(randRareness < 100) return 3; // 97 to 99 for mythic
    }

    function randMod(uint _modulus) internal view returns(uint) { // For determining itemType or itemRareness
        randNonce.add(1);
        return uint(keccak256(abi.encodePacked(now, msg.sender, randNonce))) % _modulus;
    }

    // Get Collectibles ID that belongs to the player
    function getCollectiblesId(address _owner) external view returns(uint[] memory) {
        uint[] memory result = new uint[](ownerCollectibleCount[_owner]);
        uint counter = 0;
        for (uint i = 0; i < collectibles.length; i++) {
            if (collectibleToOwner[i] == _owner) {
            result[counter] = i;
            counter++;
      }
    }
        return result;
    }
}