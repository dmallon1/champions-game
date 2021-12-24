import './App.css';
import { ethers } from "ethers";
import React from 'react';
import { abi } from './contractInterface';
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
            champs: null,
            champIds: null,
            allDungeonStakes: null,
            myDungeonStakes: null,
            showAddEther: false,
            yourWallet: ""
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

        this.provider = new ethers.providers.Web3Provider(window.ethereum)
        console.log(await this.provider.getBlockNumber());

        // this is super important, this is what links to metamask
        await this.provider.send("eth_requestAccounts", []);

        const signer = this.provider.getSigner();

        this.walletddress = await signer.getAddress();
        console.log("Account:", this.walletddress);

        // Connect to the contract
        this.readContract = new ethers.Contract(contractAddress, abi, this.provider);
        this.writeContract = this.readContract.connect(signer);
        // console.log(await readContract.symbol());


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

        this.readContract.balanceOf(this.walletddress).then((champBalance) =>
            this.setState({ champBalance: champBalance.toNumber(), showAddEther: chainId === 31337, yourWallet: this.walletddress })
        );

        this.ownerToChampionIds = await this.getOwnerToChampionIds(this.readContract);

        await this.getAllChampions();

        // TODO: do something with the dungeon stakes
        // this.dungeonStakes = await this.getDungeonStakes();
        this.refreshDungeonStakes();
        // console.log(this.dungeonStakes);

        const proms = []
        const champIds = []
        if (this.ownerToChampionIds && this.ownerToChampionIds[this.walletddress]) {
            this.ownerToChampionIds[this.walletddress].forEach(async c => {
                proms.push(this.readContract.champions(c));
                champIds.push(c);
            });
            Promise.all(proms).then(c => {
                this.setState({ champs: c, champIds: champIds });
            });
        }
    }

    async mint() {
        const signer = this.provider.getSigner();

        const estimatedGas = await this.writeContract.estimateGas.mint(signer.getAddress());
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.mint(signer.getAddress(), { gasLimit: doubleGas }));

        // this is not gonna be ready here becasue it's the transaction itself that is submitted,
        // it's not guaranteed to be done, would have to listen for that or something, that would probbaly be ideal
        // this.refreshApp();
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

    async getOwnerToChampionIds(readContract) {
        const totalTokens = await readContract.minted();
        const ownerToChampionIds = {}
        for (let i = 0; i < totalTokens; i++) {
            const owner = await readContract.ownerOf(i);
            if (ownerToChampionIds[owner] === undefined) {
                ownerToChampionIds[owner] = []
            }
            ownerToChampionIds[owner].push(i);
        }
        return ownerToChampionIds;
    }

    async getAllChampions() {
        const totalTokens = await this.readContract.minted();
        const proms = [];
        for (let i = 0; i < totalTokens; i++) {
            proms.push(this.readContract.champions(i));
        }
        Promise.all(proms).then(c => this.allChamps = c);
    }

    async refreshDungeonStakes() {
        const totalTokens = await this.readContract.minted();
        const dungeonStakes = []
        const myDungeonStakes = []
        for (let i = 0; i < totalTokens; i++) {
            const ds = await this.readContract.dungeon(i);
            if (ds.owner !== zeroAddress) {
                dungeonStakes.push(ds);
            }
            if (ds.owner === this.walletddress) {
                myDungeonStakes.push(ds);
            }
        }
        this.setState({allDungeonStakes: dungeonStakes, myDungeonStakes: myDungeonStakes});
    }

    async goToDungeon() {
        const firstChampId = this.state.champIds[0];
        console.log("sending champion " + firstChampId + " to dungeon");
        const estimatedGas = await this.writeContract.estimateGas.goToDungeon(firstChampId);
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.goToDungeon(firstChampId, { gasLimit: doubleGas }));
    }

    async claimRewards(unstake) {
        const firstChampId = this.state.allDungeonStakes.find(ds => ds.owner === this.walletddress).tokenId;
        console.log("claiming rewards for champion " + firstChampId);
        const estimatedGas = await this.writeContract.estimateGas.claimRewards(firstChampId, unstake);
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.claimRewards(firstChampId, unstake, { gasLimit: doubleGas }));
    }

    showChampionInfo(champId) {
        if (!this.allChamps) {
            return null;
        }

        const champ = this.allChamps[champId];
        const justKeys = Object.keys(champ);
        const res = justKeys.slice(justKeys.length / 2);
        const betterRes = res.map(r => {
            if (r === "level") {
                return r + " : " + levels[parseInt(champ[r])];
            }
            return r + " : " + champ[r];
        })
        return (
            <div style={{ margin: '20px' }}>
                champ id : {champId}
                {betterRes.map((x, j) => <div key={j}>{x}</div>)}
            </div>
        )
    }

    render() {
        return (
            <div className="App" >
                <header className="App-header">
                    <h1>Champions Game</h1>
                    <p>game contract: {contractAddress}</p>
                    <p>coin contract: {coinContractAddress}</p>
                    <p>your wallet: {this.state.yourWallet}</p>
                    {this.state.showAddEther && <button type="button" className="btn btn-dark" onClick={() => this.addEther()} style={{ height: '8vh', width: '40vw' }}>add ether</button>}
                    <button type="button" className="btn btn-dark" onClick={() => this.mint()} style={{ height: '8vh', width: '40vw' }}>mint</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.goToDungeon()} style={{ height: '8vh', width: '40vw' }}>go to dungeon</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.claimRewards(false)} style={{ height: '8vh', width: '40vw' }}>claim rewards only</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.claimRewards(true)} style={{ height: '8vh', width: '40vw' }}>claim rewards and unstake</button>
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
                                this.showChampionInfo(ds.tokenId)
                            )}
                        </div>
                    }
                </header>
            </div>
        );
    }
}


const contractAddress = "0xCa115285a7647b876E5973Ffd82D8B2775dd2Abc";
// const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const coinContractAddress = "0xa13a5692FCcC06A7E2b4f380d7BF3aeF96aaDEa2";
