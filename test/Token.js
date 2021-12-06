const { expect } = require("chai");

describe("Token contract", function () {
    it("Deployment should assign the total supply of tokens to the owner", async function () {
        const [owner] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("ChampionGame");

        const hardhatToken = await Token.deploy();

        const result = await hardhatToken.mint(owner.address, "");
        console.log(await hardhatToken.mint(owner.address, ""));
        console.log(await hardhatToken.mint(owner.address, ""));
        console.log(await hardhatToken.mint(owner.address, ""));
        console.log(result);

        // const ownerBalance = await hardhatToken.balanceOf(owner.address);
        // console.log(ownerBalance);
        console.log(await hardhatToken.minted())
    });
});