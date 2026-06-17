const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();


    const arbitratorAddress = deployer.address;

    console.log("Deploying with account:", deployer.address);
    console.log("Arbitrator address:", arbitratorAddress);

    const MultiPayment = await ethers.getContractFactory("MultiPayment");
    const multiPayment = await MultiPayment.deploy(arbitratorAddress);
    await multiPayment.waitForDeployment();

    console.log("MultiPayment deployed to:", await multiPayment.getAddress());

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy();
    await token.waitForDeployment();

    console.log("MockERC20 deployed to:", await token.getAddress());

    await token.mint(deployer.address, 2000n * 1_000_000n);

    console.log("Minted token to:", deployer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});