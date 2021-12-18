import logo from './logo.svg';
import './App.css';
import { ethers } from "ethers";
import React from 'react';
import abi from './contractInterface';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            champBalance: '~',
            champs: null,
            champIds: null,
            dungeonStakes: null
        }
    }

    componentDidMount() {
        this.initializeApp().then(() => console.log("initialized"));
    }

    async initializeApp() {
        // A Web3Provider wraps a standard Web3 provider, which is
        // what MetaMask injects as window.ethereum into each page
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
        this.readContract.balanceOf(signer.getAddress()).then((champBalance) => {
            // console.log(champBalance);
            this.setState({ champBalance: champBalance.toNumber() });
        });

        this.ownerToChampionIds = await this.getOwnerToChampionIds(this.readContract);
        this.dungeonStakes = await this.getDungeonStakes();
        console.log(this.dungeonStakes);

        const proms = []
        const champIds = []
        if (this.ownerToChampionIds && this.ownerToChampionIds[this.walletddress]) {
            this.ownerToChampionIds[this.walletddress].forEach(async c => {
                // const userChamp = await this.readContract.champions(c);
                proms.push(this.readContract.champions(c));
                champIds.push(c);
            });
            Promise.all(proms).then(c => {
                this.setState({ champs: c, champIds: champIds });
            });
        }
    }

    // async refreshApp() {
    //     const signer = this.provider.getSigner();
    //     this.readContract.balanceOf(signer.getAddress()).then((champBalance) => {
    //         this.setState({ champBalance: champBalance.toNumber() });
    //     });
    // }

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

    async getDungeonStakes() {
        const totalTokens = await this.readContract.minted();
        const dungeonStakes = []
        for (let i = 0; i < totalTokens; i++) {
            const ds = await this.readContract.dungeon(i);
            dungeonStakes.push(ds);
        }
        return dungeonStakes;
    }

    async goToDungeon() {
        const firstChampId = this.state.champIds[0];
        console.log("sending champion " + firstChampId + " to dungeon");
        const estimatedGas = await this.writeContract.estimateGas.goToDungeon(firstChampId);
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.goToDungeon(firstChampId, { gasLimit: doubleGas }));
    }

    async claimRewards(unstake) {
        // hardcode firstChampId for now
        const firstChampId = 0;
        console.log("claiming rewards for champion " + firstChampId);
        const estimatedGas = await this.writeContract.estimateGas.claimRewards(firstChampId, unstake);
        const doubleGas = estimatedGas.add(estimatedGas);

        console.log(await this.writeContract.claimRewards(firstChampId, unstake, { gasLimit: doubleGas }));
    }

    render() {
        return (
            <div className="App" >
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <button type="button" className="btn btn-dark" onClick={() => this.addEther()} style={{ height: '8vh', width: '10vw' }}>add ether</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.mint()} style={{ height: '8vh', width: '10vw' }}>mint</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.goToDungeon()} style={{ height: '8vh', width: '10vw' }}>go to dungeon</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.claimRewards(false)} style={{ height: '8vh', width: '10vw' }}>claim rewards only</button>
                    <button type="button" className="btn btn-dark" onClick={() => this.claimRewards(true)} style={{ height: '8vh', width: '10vw' }}>claim rewards and unstake</button>
                    <p>You have {this.state.champBalance} champs!</p>
                    {this.state.champs &&
                        <ul>
                            {this.state.champs.map((c, i) => {
                                const justKeys = Object.keys(c);
                                const res = justKeys.slice(justKeys.length / 2);
                                const betterRes = res.map(r => r + " : " + c[r])
                                return (
                                    <div key={i} style={{ margin: '20px' }}>
                                        champ id : {this.state.champIds[i]}
                                        {betterRes.map((x, j) => <div key={j}>{x}</div>)}
                                    </div>
                                )
                            })}
                        </ul>
                    }
                </header>
            </div>
        );
    }
}


const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
