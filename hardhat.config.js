/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
const { API_URL, PRIVATE_KEY } = process.env;
require("@nomiclabs/hardhat-waffle");


module.exports = {
    solidity: {
        version: "0.8.0", settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        ropsten: {
            url: API_URL,
            accounts: [`0x${PRIVATE_KEY}`]
        }
    },
    etherscan: {
        apiKey: "5XKYATUVQRUHEA77YNR8S6HUCVR2STMBDU"
    }
};
