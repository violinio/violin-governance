require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("dotenv").config();

const { PRIVATE_KEY, ETHERSCAN_APIKEY } = process.env;
let accounts = []
if (PRIVATE_KEY !== undefined) {
  accounts = [`0x${PRIVATE_KEY}`]
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {

    },
    poly: {
      url: "https://polygon-rpc.com/",
      accounts: accounts,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: accounts,
    },
    avax: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      accounts: accounts,
    },
    ftm: {
      url: "https://rpc.ftm.tools/",
      accounts: accounts,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: accounts,
    },
    xdai: {
      url: "https://rpc.xdaichain.com/",
      accounts: accounts,
    },
    harmony: {
      url: "https://api.harmony.one",
      accounts: accounts,
    },
    moonriver: {
      url: "https://rpc.moonriver.moonbeam.network",
      accounts: accounts,
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: accounts,
    },
    // TESTNETS
    avax_fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: accounts,
    },
    ftm_testnet: {
      url: "https://rpc.testnet.fantom.network/",
      accounts: accounts,
    },
    poly_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: accounts,
    },
  },
  etherscan: {
    apiKey: `${ETHERSCAN_APIKEY}`,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  deterministicDeployment: (chainId) =>  ({
     "factory": "0xdbfD940f57E63049039404c1b35b9e47e90F2B3e"
    })
  ,
};
