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

async function interactWithContract() {
    const championsGame = await ethers.getContractFactory("ChampionGame");
    const contract = await championsGame.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

    console.log(await contract.dungeon(5));
}

main()
    // interactWithContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
