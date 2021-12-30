const { ethers } = require("hardhat")

async function main() {
    const championsCoin = await ethers.getContractFactory("ChampionCoin");
    const coinContract = await championsCoin.deploy();

    const championsGame = await ethers.getContractFactory("ChampionGame");

    // Start deployment, returning a promise that resolves to a contract object
    const championGameToken = await championsGame.deploy(coinContract.address);

    // add game contract as controller of coin contract
    await coinContract.addController(championGameToken.address);

    console.log("coin contract deployed to address:", coinContract.address);
    console.log("game contract deployed to address:", championGameToken.address);

    const traits = await ethers.getContractFactory("Traits");
    const traitsContract = await traits.deploy();
    traitsContract.setChampionGame(championGameToken.address);
    console.log("traits contract deployed to address:", traitsContract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
