const { expect } = require("chai");
const { BigNumber } = require("ethers");
require("@nomiclabs/hardhat-waffle");

let coinContract;
let championGameContract;
let owner;
let addr1;
let addr2;
let addrs;

beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const championsCoin = await ethers.getContractFactory("ChampionCoin");
    coinContract = await championsCoin.deploy();

    const championsGame = await ethers.getContractFactory("ChampionGame");

    // Start deployment, returning a promise that resolves to a contract object
    championGameContract = await championsGame.deploy(coinContract.address);

    await coinContract.addController(championGameContract.address);

    // console.log("coin contract deployed to address:", coinContract.address);
    // console.log("game contract deployed to address:", championGameContract.address);
});

describe("champ tests", () => {
    it("Deployment should assign the total supply of tokens to the owner", async () => {
        expect(await championGameContract.owner()).to.equal(owner.address);

        const lastChampId = await championGameContract.connect(addr1).mint(5, { value: ethers.utils.parseEther("0.1") });

        expect(await championGameContract.balanceOf(addr1.address)).to.equal(BigNumber.from(5));
        // for (i = 0; i < 5; i++) {
        //     console.log(await championGameContract.champions(i));
        // }

        // send 2 to dungeon, 2 to sparring pits
        await championGameContract.connect(addr1).stakeChampion([0, 1], 0);
        await championGameContract.connect(addr1).stakeChampion([2, 3], 1);

        expect(await championGameContract.balanceOf(championGameContract.address)).to.equal(BigNumber.from(4));
        expect(await championGameContract.balanceOf(addr1.address)).to.equal(BigNumber.from(1));

        // advance time
        const sevenDays = 7 * 24 * 60 * 60;
        await ethers.provider.send('evm_increaseTime', [sevenDays]);
        await ethers.provider.send('evm_mine');

        await championGameContract.connect(addr1).claimRewards(0, false);

        const coinBalance = await coinContract.balanceOf(addr1.address);
        expect(coinBalance).to.be.above(BigNumber.from(0));

        await championGameContract.connect(addr1).claimRewards(2, false);

        const newCoinBalance = await coinContract.balanceOf(addr1.address);
        expect(newCoinBalance).to.be.below(coinBalance);

        const champ = await championGameContract.champions(2);
        console.log(newCoinBalance, coinBalance);
        expect(champ.level).to.be.above(1);
        const levelDifference = champ.level - 1;
        expect(newCoinBalance).to.equal(coinBalance - (10 * levelDifference));
    });

    // it("validates dungeon and sparring pits", async () => {
    //     // const accounts = await hre.ethers.getSigners();

    //     // for (const account of accounts) {
    //     //     console.log(account.address);
    //     // }
    // });
});