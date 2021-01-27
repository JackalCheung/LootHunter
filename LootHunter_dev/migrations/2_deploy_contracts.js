// var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var Collectible = artifacts.require("./CollectibleOwnership.sol");
var GameController = artifacts.require("./GameController.sol");
var GameLearning = artifacts.require("./GameLearning.sol");
var Learning = artifacts.require("./Learning.sol");

module.exports = function (deployer) {
  // deployer.deploy(SimpleStorage);
  deployer.deploy(Collectible);
  deployer.deploy(GameController);
  deployer.deploy(GameLearning);
  deployer.deploy(Learning);
};
