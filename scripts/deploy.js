const { ethers } = require("hardhat")

async function main() {
    const championsCoin = await ethers.getContractFactory("ChampionCoin");
    const coinContract = await championsCoin.deploy();

    const championsGame = await ethers.getContractFactory("ChampionGame");

    // Start deployment, returning a promise that resolves to a contract object
    const championGameToken = await championsGame.deploy(coinContract.address);
    console.log("Contract deployed to address:", championGameToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
