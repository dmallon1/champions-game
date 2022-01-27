import './App.css';
import { ethers } from "ethers";
import React from 'react';
import { abi } from './contractInterface';
import { coinAbi } from './coinContractInterface';
import { traitAbi } from './traitContractInterface';
import Navbar from 'react-bootstrap/Navbar';
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Nav from 'react-bootstrap/Nav';

const zeroAddress = "0x0000000000000000000000000000000000000000";
const levels = ["common",
    "uncommon",
    "rare",
    "epic",
    "legendary"];

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            champBalance: '~',
            coinBalance: '~',
            champs: null,
            champIds: null,
            allDungeonStakes: null,
            myDungeonStakes: null,
            showAddEther: false,
            myWallet: "",
            mintAmount: "",
            stakeChampionId: "",
            locationNumber: ""
        }

        this.showChampionInfo = this.showChampionInfo.bind(this);
    }

    componentDidMount() {
        this.initializeApp().then(() => console.log("initialized"));
    }

    async initializeApp() {
        // A Web3Provider wraps a standard Web3 provider, which is
        // what MetaMask injects as window.ethereum into each page
        if (window.ethereum === undefined) {
            console.log("window.ethereum missing");
            return;
        }

        this.provider = new ethers.providers.Web3Provider(window.ethereum, "any")
        this.provider.on("network", (newNetwork, oldNetwork) => {
            // When a Provider makes its initial connection, it emits a "network"
            // event with a null oldNetwork along with the newNetwork. So, if the
            // oldNetwork exists, it represents a changing network
            if (oldNetwork) {
                window.location.reload();
            }
        });
        console.log(await this.provider.getBlockNumber());

        // this is super important, this is what links to metamask
        await this.provider.send("eth_requestAccounts", []);

        const signer = this.provider.getSigner();

        this.walletddress = await signer.getAddress();
        console.log("Account:", this.walletddress);

        // Connect to the contract
        this.readContract = new ethers.Contract(contractAddress, abi, this.provider);
        this.writeContract = this.readContract.connect(signer);
        this.coinReadContract = new ethers.Contract(coinContractAddress, coinAbi, this.provider);
        this.traitReadContract = new ethers.Contract(traitsContractAddress, traitAbi, this.provider);
        this.traitWriteContract = this.traitReadContract.connect(signer);

        this.refreshApp();

        // listen to transfer events
        this.readContract.on("Transfer", (from, to, amount, event) => {
            console.log(`${from} sent ${amount} to ${to}`);
            console.log(event);
            this.refreshApp();
            // The event object contains the verbatim log data, the
            // EventFragment and functions to fetch the block,
            // transaction and receipt and event functions
        });
    }

    async refreshApp() {
        const { chainId } = await this.provider.getNetwork();
        const totalTokens = await this.readContract.minted();
        const myCoinBalance = await this.getCoinBalance();

        this.readContract.balanceOf(this.walletddress).then((champBalance) =>
            this.setState({ champBalance: champBalance.toNumber() })
        );

        this.ownerToChampionIds = await this.getOwnerToChampionIds(totalTokens);

        await this.getAllChampions(totalTokens);

        this.refreshDungeonStakes(totalTokens);

        const proms = []
        const champIds = []
        if (this.ownerToChampionIds && this.ownerToChampionIds[this.walletddress]) {
            this.ownerToChampionIds[this.walletddress].forEach(async c => {
                console.log("refresh");
                console.log(c);
                proms.push(this.readContract.champions(c));
                champIds.push(c);
            });
        }
        Promise.all(proms).then(c => {
            this.setState({ champs: c, champIds: champIds, showAddEther: chainId === 31337, myWallet: this.walletddress, coinBalance: myCoinBalance });
        });
    }

    async mint() {
        let amount = 10;
        if (this.state.mintAmount !== "") {
            amount = this.state.mintAmount;
        }

        const price = amount * .02;

        // TODO: update this to not be hardcoded
        const estimatedGas = await this.writeContract.estimateGas.mint(amount, { value: ethers.utils.parseEther(price.toString()) });
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.mint(amount, { gasLimit: doubleGas, value: ethers.utils.parseEther(price.toString()) }));
    }

    async addEther() {
        const provider = new ethers.providers.JsonRpcProvider();
        const signer = provider.getSigner()

        const tx = await signer.sendTransaction({
            to: this.walletddress,
            value: ethers.utils.parseEther("1.0")
        });
        console.log(tx);
    }

    async getOwnerToChampionIds(totalTokens) {
        const ownerToChampionIds = {}
        for (let i = 0; i < totalTokens; i++) {
            const owner = await this.readContract.ownerOf(i);
            if (ownerToChampionIds[owner] === undefined) {
                ownerToChampionIds[owner] = []
            }
            ownerToChampionIds[owner].push(i);
        }
        return ownerToChampionIds;
    }

    async getAllChampions(totalTokens) {
        const proms = [];
        for (let i = 0; i < totalTokens; i++) {
            console.log("get all champs");
            console.log(i);
            proms.push(this.readContract.champions(i));
        }
        Promise.all(proms).then(c => this.allChamps = c);
    }

    async refreshDungeonStakes(totalTokens) {
        const dungeonStakes = []
        const myDungeonStakes = []
        for (let i = 0; i < totalTokens; i++) {
            const ds = await this.readContract.stakes(i);
            if (ds.owner !== zeroAddress) {
                dungeonStakes.push(ds);
            }
            if (ds.owner === this.walletddress) {
                myDungeonStakes.push({ id: i, stake: ds });
            }
        }
        console.log(myDungeonStakes);
        this.setState({ allDungeonStakes: dungeonStakes, myDungeonStakes: myDungeonStakes });
    }

    async stake() {
        let firstChampId = this.state.champIds[0];
        let location = 0;

        if (this.state.stakeChampionId !== "") {
            firstChampId = this.state.stakeChampionId;
        }

        if (this.state.locationNumber !== "") {
            location = this.state.locationNumber;
        }

        console.log("sending champion " + firstChampId + " to " + location);
        const estimatedGas = await this.writeContract.estimateGas.stakeChampion([firstChampId], location);
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.stakeChampion([firstChampId], location, { gasLimit: doubleGas }));
    }

    async claimRewards(unstake) {
        if (this.state.myDungeonStakes.length === 0) {
            return;
        }
        let firstChampId = this.state.myDungeonStakes[0].id;

        if (this.state.stakeChampionId !== "") {
            firstChampId = this.state.stakeChampionId;
        }

        console.log("claiming rewards for champion " + firstChampId);
        const estimatedGas = await this.writeContract.estimateGas.claimRewards(firstChampId, unstake);
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.claimRewards(firstChampId, unstake, { gasLimit: doubleGas }));
    }

    async getCoinBalance() {
        const myCoinBalance = await this.coinReadContract.balanceOf(this.walletddress);
        const balStr = myCoinBalance.toString();
        if (balStr === '0') {
            return 0;
        }
        const realTing = balStr.substring(0, balStr.length - 18);
        return realTing;
    }

    showChampionInfo(champId) {
        if (!this.allChamps) {
            return null;
        }

        const champ = this.allChamps[champId];
        const justKeys = Object.keys(champ);
        const res = justKeys.slice(justKeys.length / 2);
        const betterRes = res.map(r => {
            if (r === "rank") {
                return r + ": " + levels[parseInt(champ[r])];
            }
            return r + ": " + champ[r];
        })
        return (
            <div key={champId} style={{ margin: '20px' }}>
                champ id: {champId}
                {betterRes.map((x, j) => <div key={j}>{x}</div>)}
            </div>
        )
    }

    async uploadImage() {
        this.traitWriteContract.uploadTraits(0, [0], [{ name: "face", png: "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAgMAAAAOFJJnAAAADFBMVEUAAADesC+ygyzp4iXM8PRTAAAAAXRSTlMAQObYZgAAABVJREFUGNNjGDyABcbQhTE4GAYcAAAgKAA6oPTpgwAAAABJRU5ErkJggg==" }]);
    }

    async readTraitData() {
        console.log(await this.traitReadContract.traitData(0, 1));
    }

    handleChange(event, name) {
        this.setState({ [name]: event.target.value });
    }

    Game() {
        return (
            <div className="App" >
                <header className="App-header">
                    <h1>Champions Game</h1>

                    {/* <p>game contract: {contractAddress}</p>
                    <p>coin contract: {coinContractAddress}</p> */}
                    {/* <p>your wallet: {this.state.myWallet}</p> */}
                    {this.state.showAddEther && <button type="button" className="btn btn-dark" onClick={() => this.addEther()} style={{ height: '8vh', width: '40vw' }}>add ether</button>}
                    <div>
                        <button type="button" className="btn btn-dark" onClick={() => this.mint()} style={{ height: '8vh', width: '40vw' }}>mint</button>
                        <input type="text" placeholder='amount' value={this.state.mintAmount} onChange={(e) => this.handleChange(e, "mintAmount")} />
                    </div>
                    <br />
                    <button type="button" className="btn btn-dark" onClick={() => this.stake()} style={{ height: '8vh', width: '40vw' }}>stake</button>
                    <input type="text" placeholder='location' value={this.state.locationNumber} onChange={(e) => this.handleChange(e, "locationNumber")} />

                    <button type="button" className="btn btn-dark" onClick={() => this.claimRewards(false)} style={{ height: '8vh', width: '40vw' }}>claim rewards only</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.claimRewards(true)} style={{ height: '8vh', width: '40vw' }}>claim rewards and unstake</button>
                    <input type="text" placeholder='champion id' value={this.state.stakeChampionId} onChange={(e) => this.handleChange(e, "stakeChampionId")} />
                    {/* <button type="button" className="btn btn-dark" onClick={() => this.uploadImage()} style={{ height: '8vh', width: '40vw' }}>upload image</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.readTraitData()} style={{ height: '8vh', width: '40vw' }}>read image data</button> */}
                    <p>$CCOIN balance: {this.state.coinBalance}</p>
                    <p>You have {this.state.champBalance} champs in your wallet!</p>
                    {this.state.champs &&
                        <div>
                            {this.state.champs.map((c, i) =>
                                this.showChampionInfo(this.state.champIds[i])
                            )}
                        </div>
                    }
                    {this.state.myDungeonStakes &&
                        <div>
                            <p>You have {this.state.myDungeonStakes.length} champs in the dungeon!</p>
                            {this.state.myDungeonStakes.map((ds) =>
                                this.showChampionInfo(ds.id)
                            )}
                        </div>
                    }
                </header>
            </div>
        );
    }

    render() {
        return (
            <Router>
                <NavBarFunc productsInCart={this.state.productsInCart} numProducts={this.numProducts} />
                <Routes>
                    <Route path="/" exact element={this.Game()} />
                    <Route path="/whitepaper" element={Whitepaper()} />
                    <Route path="/faq" element={FAQ()} />
                </Routes>
            </Router>
        );
    }
}

function NavBarFunc(props) {
    return (
        <Navbar className="border border-dark" style={{ backgroundColor: 'black' }}>
            <Link to="/">
                <h1 text-size="20px">CHAMPIONS GAME</h1>
            </Link>
            <Nav className="ml-5 nav-color">
                <Link to="/whitepaper">
                    whitepaper
                </Link>
            </Nav>
            <Nav className="ml-5">
                <Link to="/faq">
                    faq
                </Link>
            </Nav>
        </Navbar>
    );
}

function Whitepaper() {
    return (
        <div className='half-black pb-5'>
            <div className='container' style={{ color: "white", maxWidth: '940px' }}>
                <h1>Champions Game</h1>

                <h2>Intro</h2>
                <p>In a dark corner of the metaverse, Champions Game is born. A 100% on chain nft game where players can mint their own
                    unique champion, stake it to earn $CCOIN, spend $CCOIN to level up and gain rewards, and battle other nfts in a winner take all battle.</p>
                <p>Champions Game is a play-to-earn 100% on-chain game and eco-system. Champions and their weapons go on raids, pillages, journeys, and more.</p>
                <p>Each collection within the Champions Game world has a unique utility that gives it access to in game tokens that drive most actions and rewards.</p>
                <p>Through interactive and strategic gameplay, players earn better gear, more NFTs, and compete in an immersive eco-system built on the bedrock of the Ethereum blockchain.</p>
                <p>As long as champions continue to battle and train, there will always new adventures and treasures awaiting the chamions just over the horizon.</p>

                <h2>Actions</h2>
                <h4>Minting</h4>
                <p>When minting your nft you have the option to stake it right away. This will save money on gas and your character will start earning $CCOIN right away.</p>
                <h4>Staking</h4>
                <p>When staking your champion is automatically earning $CCOIN every second. You may only claim rewards after staking for at least 2 days.</p>
                <p>The amount of $CCOIN you earn will depend on your level and stats.</p>
                <p>When staking you can also level up by spending your $CCOIN on a level boost.</p>
                <h4>Battle</h4>
                <p>Coming in phase 2, your champion will be able to battle other champion nfts in winner take all
                    matchup. The winner of the battle will capture his opponents nft. This is the ultimate pvp battle.</p>

                <h2>Phases</h2>
                <p>The first phase of the game will launch with minting, staking to earn $CCOIN and to spend $CCOIN to level up.</p>
                <p>Phase two will include the art being published, and battle action.</p>

                <h2>$CCOIN</h2>
                <p>$CCOIN is the in game currency of CHAMPIONS GAME. It will be used at the start of the game to level up and in future phases of
                    the game it will be used for battling and raiding.</p>

                TODO:
                <p>Phase three will be a self sustaining dao where champions can vote on goverance. We will also be implementing a treasury that
                    will help stabalize the price of $CCOIN and reward long term holders as the game grows.</p>

                <h2>Contract addresses</h2>
                <p>champions game contract: {contractAddress}</p>
                <p>$CCOIN contract: {coinContractAddress}</p>
                <p>traits contract: {traitsContractAddress}</p>
            </div>
        </div>

    );
}

function FAQ() {
    return (
        <div className='half-black pb-5'>
            <div className='container' style={{ color: "white", maxWidth: '940px' }}>
                <h1>FAQ</h1>
                <p>Q: How much is 1 $CCOIN worth?</p>
                <p>A: 1 $CCOIN = 1 $CCOIN</p>
                <br />
                <p>Q: What do the champions look like?</p>
                <p>A: This is a basic champion</p>
                <svg id="champ" width="300px" height="300px" version="1.1" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                    <image x="4" y="4" width="32" height="32" imageRendering="pixelated" preserveAspectRatio="xMidYMid" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHBSURBVHgBzVc7TgNBDJ2JOANKRQE3oNwSGupcA85AwRngCFBGlDRQbskNQIgq4hLD2lqvnMEza3tClCeNVuv57Iv97HFCODDEYEfa4VlNhyCR1eoKXy4vuq3J65tbz5lthIhMDk5uJOYmtVCuS113Hjabn9mFD/d3uD44oSGEZAgaUi1Qeajv34tzuZb2gcTH4C3QUsrtwnDhSLOIh2y5PNZscYtaRYjAyYziRVDKk214T15SGg1F0hAX9Otbj4NDsv0HoS0YssylpbmQTQfyTOOaKnnEG77aQqzMkNb00fX6JWgAhEFvVBIs1XsxRwaQ1xqYg8GFDeDvEFqPpmazjA4saScnBRAKqTpkJUJxCM+kHwrV2elJ+Pj8DpysVKlJYyMxU/pXPaTRTImUsoD+QS3tYzaqpPgTyGgTwEJIBIRN+hiQEew76SJLwEI3EMIRCpdqdvGaYfIQpDqJGjzFR75uH8BfX2s9hDkzXE0+r8D8nenIrR3rxiTsl2xumPohALs0J1vmNXcvBLCIGu+30t3U2gcRTB6i++zx6RkeXwV7E1o0FAVbPmeG+Z+r0OOI2RecpMxpX9ifhLXma+kg8QsZfOWf+gyzmwAAAABJRU5ErkJggg==" />
                    <image x="4" y="4" width="32" height="32" imageRendering="pixelated" preserveAspectRatio="xMidYMid" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB/SURBVHgB7dTNDYAgDAXgaljDzVzFk6u4mYNUSdqDWP9iaI153wVCSHhpASIAAAAA+JRGRn64v5qkk3GaTzcOfUceUnGoWYE17N0Kvpbo4vCjkLW01mIO4R1E7SqUg2iVokIptu6KrLndodImVEQYqyWsX4A89dC2qdA2AfzKAhT6KRiziOzpAAAAAElFTkSuQmCC" />
                    <image x="4" y="4" width="32" height="32" imageRendering="pixelated" preserveAspectRatio="xMidYMid" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACgSURBVHgB7ZMxDsMgDEVt1DNUOUfHzByFY8EVMnfgMmxRDxEXIzVKRdqteOh/A4a/8GQDEQAAAADAf8Nkg5xkvC+DkZxzF3rvtbBZh45SLxkyRqV0dHKU+anVPN/aW5mm61u+LHf61KELDWBdH11WSmlVpDkLWcPMklISrTRqZN9kYoz7OYSgnXJ1KxZCW5Xp7q1S2iln9dW2k8wRAGAATz6qMXK+ntNRAAAAAElFTkSuQmCC" />
                </svg>
            </div>
        </div>

    );
}


const coinContractAddress = "0x26B9b8Ffc0948d364a087656dd63e0972dea5805";
const contractAddress = "0x3777231bc60A15A982C7d4Af8054e8445F62447c";
const traitsContractAddress = "0x8E1290b017802B5732747FEed5B46B4A8bC6933a";
