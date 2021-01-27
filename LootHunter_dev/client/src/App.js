import React, { Component } from "react";
// import SimpleStorageContract from "./contracts/SimpleStorage.json";
import Collectible from "./contracts/CollectibleOwnership.json";
import GameController from "./contracts/GameController.json";
import GameLearning from "./contracts/GameLearning.json";
import Learning from "./contracts/Learning.json";
import getWeb3 from "./getWeb3";
import EventDispatcher from "./js/util/EventDispatcher";
import AI from "./js/util/AI";

import "./App.css";

var AppSelf;

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, collectibleContract: null, gameContract: null, learningContract: null, testLearnContract: null, emitter: null, ai: null };

  componentDidMount = async () => {
    try {
      AppSelf = this;
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      /*
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      */

      // Get all contracts instance.
      const collectibleNetworkId = await web3.eth.net.getId();
      const collectibleDeployedNetwork = Collectible.networks[collectibleNetworkId];
      const collectibleInstance = new web3.eth.Contract(
        Collectible.abi,
        collectibleDeployedNetwork && collectibleDeployedNetwork.address,
      );

      const controllerNetworkId = await web3.eth.net.getId();
      const controllerDeployedNetwork = GameController.networks[controllerNetworkId];
      const controllerInstance = new web3.eth.Contract(
        GameController.abi,
        controllerDeployedNetwork && controllerDeployedNetwork.address,
      );

      const learningNetworkId = await web3.eth.net.getId();
      const learningDeployedNetwork = GameLearning.networks[learningNetworkId];
      const learningInstance = new web3.eth.Contract(
        GameLearning.abi,
        learningDeployedNetwork && learningDeployedNetwork.address,
      );

      const testLearnNetworkId = await web3.eth.net.getId();
      const testLearnDeployedNetwork = Learning.networks[testLearnNetworkId];
      const testLearnInstance = new web3.eth.Contract(
        Learning.abi,
        testLearnDeployedNetwork && testLearnDeployedNetwork.address,
      );


      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, collectibleContract: collectibleInstance, gameContract: controllerInstance, learningContract: learningInstance, testLearnContract: testLearnInstance, emitter: EventDispatcher.getInstance(), ai: AI.getInstance() }, this.transmitAccount);

      // Set event listener
      this.setEventListeners();

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  transmitAccount = async () => {
    const { accounts, contract, collectibleContract } = this.state;
    this.trainAI();
  };

  trainAI = async () => {
    AppSelf.state.learningContract.getPastEvents("moveChoice", { filter: { playerId: this.state.accounts[0] }, fromBlock: 0, toBlock: 'latest' },
      (error, result) => {
        console.log("MoveChoice:");
        console.log(result);
      })
      .then((events) => {
        let learningBlock;
        let learningData;
        // Can't init as 0 as the block is empty

        for (let i = 1; i < events.length + 1; i++) {
          learningBlock = events[events.length - i];
          // All the return values in the block
          learningData = learningBlock.returnValues;
          this.state.ai.trainMove(learningData.GRULocation, learningData.toDeath, learningData.toKill);
        }

      });

    AppSelf.state.learningContract.getPastEvents("attackChoice", { filter: { playerId: this.state.accounts[0] }, fromBlock: 0, toBlock: 'latest' },
      (error, result) => {
        console.log("AttackChoice:");
        console.log(result);
      })
      .then((events) => {
        let learningBlock;
        let learningData;

        // Can't init as 0 as the block is empty
        for (let i = 1; i < events.length + 1; i++) {
          learningBlock = events[events.length - i];
          // All the return values in the block
          learningData = learningBlock.returnValues;
          this.state.ai.trainAttack(learningData.isTargetAttackable, learningData.enemyHealthLeft, learningData.damageToTarget,
            learningData.toDeath, learningData.toKill, learningData.chosenTarget);
        }

      });
  }

  setEventListeners = function () {
    // Testing Events
    AppSelf.state.emitter.on("getSample", this.createSample.bind(this));

    // Account Events
    AppSelf.state.emitter.on("getUserAccount", this.getUserAccount.bind(this));

    // Inventory Events
    AppSelf.state.emitter.on("getCollectibles", this.getCollectibles.bind(this));

    // Trading Events
    AppSelf.state.emitter.on("transferOwnership", this.transferOwnership.bind(this));

    // Match Events
    AppSelf.state.emitter.on("matchStart", this.matchStart.bind(this));
    AppSelf.state.emitter.on("transmitData", this.transmitData.bind(this));
    AppSelf.state.emitter.on("roundEnd", this.roundEnd.bind(this));
    AppSelf.state.emitter.on("matchEnd", this.matchEnd.bind(this));

    // Rewind Events
    AppSelf.state.emitter.on("getMatchIndex", this.getMatchIndex.bind(this));
    AppSelf.state.emitter.on("getRoundIndex", this.getRoundIndex.bind(this));
    AppSelf.state.emitter.on("getRewindData", this.getRewindData.bind(this));
  }

  // Test the obtainCollectible method in CollectibleFactory contract 
  createSample = function () {
    console.log("Created 1 Sample");
    AppSelf.state.collectibleContract.methods.obtainCollectible(1).send({ from: this.state.accounts[0] });
  }

  // Get user account information
  getUserAccount = function () {
    AppSelf.state.emitter.emit("showUserAccount", this.state.accounts[0]);
  }

  // *Inventory scene contract interaction
  // Present all collectibles belong to the player
  getCollectibles = async (scene) => {
    // Get collectibles from CollectibleFactory contract
    console.log("Getting player's collectibles");
    var IDs = await this.state.collectibleContract.methods.getCollectiblesId(this.state.accounts[0]).call({ from: this.state.accounts[0] });
    console.log(IDs);
    IDs.forEach(id =>
      AppSelf.state.collectibleContract.methods.collectibles(id).call()
        .then(function (collectible) {
          if (scene == "Preparation") {
            AppSelf.state.emitter.emit("createItemInterface",
              collectible.itemType, collectible.itemRareness,
              collectible.itemAttribute, collectible.itemLevel, id);
          } else if (scene == "Trade") {
            AppSelf.state.emitter.emit("createInventory",
              collectible.itemType, collectible.itemRareness,
              collectible.itemAttribute, collectible.itemLevel, id);
          }
        }));
  }

  // *Trading Events
  transferOwnership = async (_owner, _to, id) => {
    let result = await AppSelf.state.collectibleContract.methods.transferFrom(_owner, _to, id).send({ from: this.state.accounts[0] });
    console.log(result);
  }

  // *Single player scene contract interaction
  // Initialize match data when match starts
  matchStart = function (chessId, chessType, weaponType, attack, defense) {
    console.log("Match Start");
    console.log(chessId, chessType, weaponType, attack, defense);
    AppSelf.state.gameContract.methods.initializeMatch(chessId, chessType, weaponType, attack, defense).send({ from: this.state.accounts[0] });
  }

  // Training Data
  transmitData = async (isTargetAttackable, enemyHealthLeft, damageToTarget, toDeath1, toKill1, chosenTarget, GRULocation, toDeath2, toKill2) => {
    if (GRULocation != []) {
      console.log("Transmit move data");
      await AppSelf.state.learningContract.methods.saveMoveData(GRULocation, toDeath2, toKill2).send({ from: this.state.accounts[0] });
    }
    if (isTargetAttackable != []) {
      console.log("Transmit attack data");
      await AppSelf.state.learningContract.methods.saveAttackData(isTargetAttackable, enemyHealthLeft, damageToTarget, toDeath1, toKill1, chosenTarget).send({ from: this.state.accounts[0] });
    }
  }

  // Activate per round ends
  roundEnd = async (matchIndex, roundNum, chessId, health, xCord, yCord,) => {
    console.log("Updating match record for turn number " + roundNum);
    // await AppSelf.state.gameContract.methods.updateRoundRecord(roundNum, chessId, health, xCord, yCord).send({ from: this.state.accounts[0] });
    await AppSelf.state.gameContract.methods.updateRoundRecord(matchIndex, roundNum, chessId, health, xCord, yCord).send({ from: this.state.accounts[0] });
    AppSelf.state.emitter.emit("turnControl");
  }

  // Announce result and obtain collectibles when match ends
  matchEnd = async (matchIndex, result, collectibleIDs, pointsEarned) => {
    await AppSelf.state.gameContract.methods.resultAnnounce(matchIndex, result).send({ from: this.state.accounts[0] });
    console.log("Result sent");
    await AppSelf.state.collectibleContract.methods.specialisationAdd(collectibleIDs, pointsEarned).send({ from: this.state.accounts[0] });
    console.log("Collectibles point added");
    if (result) {
      // Decide how many collectibles the player can obtain by random number
      let amountObtained = Math.floor(Math.random() * 2) + 1;
      await AppSelf.state.collectibleContract.methods.obtainCollectible(amountObtained).send({ from: this.state.accounts[0] });
      console.log("Collectibles earned");
    }
  }

  // *Rewind scene contract interaction
  // Get the number of matches played by the player
  getMatchIndex = async (scene) => {
    let matchIndex = await AppSelf.state.gameContract.methods.getMatchIndex(this.state.accounts[0]).call({ from: this.state.accounts[0] });

    if (scene == "Rewind") {
      AppSelf.state.emitter.emit("showMatchIndex", matchIndex);
    } else if (scene == "Match") {
      AppSelf.state.emitter.emit("setMatchIndex", parseInt(matchIndex)+1);
    }
   
  }

  // Get the number of rounds when match is selected
  getRoundIndex = async (chosenMatch) => {
    let roundIndex = await AppSelf.state.gameContract.methods.getRoundIndex(chosenMatch).call({ from: this.state.accounts[0] });
    let result = "Not Finished";
    await AppSelf.state.gameContract.getPastEvents("announceResult", { filter: { playerId: this.state.accounts[0], matchIndex: chosenMatch }, fromBlock: 0, toBlock: 'latest' },
      (error, result) => {
      })
      .then((events) => {
        if (events.length !== 0) {
          result = events[events.length - 1].returnValues.result;
        }
      });
    AppSelf.state.emitter.emit("showRoundIndex", roundIndex, result);
  }

  // Get data for rewind match
  getRewindData = async (matchIndex, roundIndex, chessId) => {
    var initRecord;
    var initValues;
    var roundRecord;
    var roundValues;
    await AppSelf.state.gameContract.getPastEvents("chessInitialize", { filter: { playerId: this.state.accounts[0], matchIndex: matchIndex, chessId: chessId }, fromBlock: 0, toBlock: 'latest' })
      .then((events) => {
        initRecord = events[events.length - 1];
        initValues = initRecord.returnValues;
        console.log(initValues);
      });
    await AppSelf.state.gameContract.getPastEvents("chessAction", { filter: { playerId: this.state.accounts[0], matchIndex: matchIndex, roundNum: roundIndex }, fromBlock: 0, toBlock: 'latest' })
      .then((events) => {
        for (let i = 1; i < events.length + 1; i++) {
          if (parseInt(events[events.length - i].returnValues.chessId) == chessId) {
            roundRecord = events[events.length - i];
            roundValues = roundRecord.returnValues;
          }
        }
      });
    AppSelf.state.emitter.emit("sendRewindData", chessId, initValues.weaponType, initValues.attack, initValues.defense, roundValues.health, roundValues.xCord, roundValues.yCord);
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">

      </div>
    );
  }
}

export default App;
