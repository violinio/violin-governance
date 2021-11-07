const { NonceManager } = require("@ethersproject/experimental");

const delay = ms => new Promise(res => setTimeout(res, ms));
const etherscanChains = ["poly", "bsc", "poly_mumbai", "ftm", "arbitrum"];
const sourcifyChains = ["xdai", "celo", "avax", "avax_fuji", "arbitrum"];


const participants = [
    "0x8EBC8af7a3E5b86426AE0C37a3372f07Af57eE2A", // Immodest Extant
    "0xE1A18d5A17692a04E988Bf44ccC7b446aC669140", // Muse
    "0x8064a0DE02E40dB0023eD40E194DAEa6533a77C6", // The Rug Doctor

];
const quorum = 2;

const main = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const managedDeployer = new NonceManager(deployer);
    const signer = await hre.ethers.getSigner(deployer);
    
    // We get the contract to deploy
    const msTimelock1 = await deploy("MultisigTimelock", { from: managedDeployer.signer, log: true, args: [],
        deterministicDeployment: "0x0000000000000000000000000000000000000000000000000000000000000000" });
    const msContractFactory = await ethers.getContractFactory("MultisigTimelock");
    const mContract1 = await msContractFactory.attach(msTimelock1.address);
    if((await mContract1.adminLength()) === 0){
        await mContract1.connect(signer).initialize(participants, quorum);
        console.log("initialized timelock 1");
    }

    console.log("MultisigTimelock #1 deployed to:", msTimelock1.address);
    const msTimelock2 = await deploy("MultisigTimelock", { from: managedDeployer.signer, log: true, args: [],
        deterministicDeployment: "0x0000000000000000000000000000000000000000000000000000000000000001" });
    const mContract2 = await msContractFactory.attach(msTimelock2.address);
    if((await mContract2.adminLength()) === 0){
        await mContract2.connect(signer).initialize(participants, quorum);
        console.log("initialized timelock 2");
    }
    console.log("MultisigTimelock #2 deployed to:", msTimelock2.address);

    const chain = hre.network.name;
    try {
        await verify(hre, chain, msTimelock1.address, []);
    } catch (error) {
        console.log(error);
    }

    try {
        await verify(hre, chain, msTimelock2.address, []);
    } catch (error) {
        console.log(error);
    }
}

async function verify(hre, chain, contract, args) {
    const isEtherscanAPI = etherscanChains.includes(chain);
    const isSourcify = sourcifyChains.includes(chain);
    if(!isEtherscanAPI && !isSourcify)
        return;

    console.log('verifying...');
    await delay(5000);
    if (isEtherscanAPI) {
        await hre.run("verify:verify", {
            address: contract,
            network: chain,
            constructorArguments: args
        });
    } else if (isSourcify) {
        try {
            await hre.run("sourcify", {
                address: contract,
                network: chain,
                constructorArguments: args
            });
        } catch (error) {
            console.log("verification failed: sourcify not supported?");
        }
    }
}

module.exports = main;