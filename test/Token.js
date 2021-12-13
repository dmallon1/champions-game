const { expect } = require("chai");

describe("Token contract", () => {
    it("Deployment should assign the total supply of tokens to the owner", async () => {
        const [owner] = await ethers.getSigners();

        const championsCoin = await ethers.getContractFactory("ChampionCoin");
        const coinContract = await championsCoin.deploy();

        const championsGame = await ethers.getContractFactory("ChampionGame");

        const hardhatToken = await championsGame.deploy(coinContract.address);

        const result = await hardhatToken.mint(owner.address);
        console.log(await hardhatToken.mint(owner.address));
        console.log(await hardhatToken.mint(owner.address));
        console.log(await hardhatToken.mint(owner.address));
        console.log(result);

        // const ownerBalance = await hardhatToken.balanceOf(owner.address);
        // console.log(ownerBalance);
        console.log(await hardhatToken.minted())
        await hardhatToken.goToDungeon(3)
        // hardhatToken.goToDungeon(3)
        // console.log(await hardhatToken.dungeon(3));
    });
});