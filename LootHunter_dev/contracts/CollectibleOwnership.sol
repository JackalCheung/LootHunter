pragma solidity ^0.5.2;
import "./erc721.sol";
import "./safemath.sol";
import "./CollectibleUpgrade.sol";

contract CollectibleOwnership is CollectibleUpgrade, ERC721 {
    
    using SafeMath for uint256;
    
    mapping (uint => address) collectibleApprovals;
    
    function balanceOf(address _owner) external view returns (uint256) {
    return ownerCollectibleCount[_owner];
  }

  function ownerOf(uint256 _tokenId) external view returns (address) {
    return collectibleToOwner[_tokenId];
  }
  
  function _transfer(address _from, address _to, uint256 _tokenId) private {
    ownerCollectibleCount[_to] = ownerCollectibleCount[_to].add(1);
    ownerCollectibleCount[_from] = ownerCollectibleCount[_from].sub(1);
    collectibleToOwner[_tokenId] = _to;
    emit Transfer(_from, _to, _tokenId);
  }

  function transferFrom(address _from, address _to, uint256 _tokenId) external payable {
    require (collectibleToOwner[_tokenId] == msg.sender || collectibleApprovals[_tokenId] == msg.sender);
    _transfer(_from, _to, _tokenId);
  }

  function approve(address _approved, uint256 _tokenId) external payable onlyOwnerOf(_tokenId) {
    collectibleApprovals[_tokenId] = _approved;
    emit Approval(msg.sender, _approved, _tokenId);
  }
    
}