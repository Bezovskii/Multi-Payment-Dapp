const { ethers } = require("hardhat");

async function main() {
    const [deployer, arbitrator] = await ethers.getSigners();

    console.log("Deploying with account:", deployer.address);
    console.log("Arbitrator address:", arbitrator.address);

    const MultiPayment = await ethers.getContractFactory("MultiPayment");

    const multiPayment = await MultiPayment.deploy(arbitrator.address);

    await multiPayment.waitForDeployment();

    console.log("MultiPayment deployed to:", await multiPayment.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});