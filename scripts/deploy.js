const { ethers } = require("hardhat");

async function main() {
    const [buyer, arbitrator, seller] = await ethers.getSigners();

    console.log("Deploying with account:", buyer.address);
    console.log("Arbitrator address:", arbitrator.address);
    console.log("Seller address:", seller.address);

    const MultiPayment = await ethers.getContractFactory("MultiPayment");
    const multiPayment = await MultiPayment.deploy(arbitrator.address);
    await multiPayment.waitForDeployment();

    console.log("MultiPayment deployed to:", await multiPayment.getAddress());

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy();
    await token.waitForDeployment();

    console.log("MockERC20:", await token.getAddress());

    await token.mint(buyer.address, 2000n * 1_000_000n);

    console.log("Minted token to buyer:", buyer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});