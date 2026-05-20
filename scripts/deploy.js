const { ethers } = require("hardhat");

async function main() {
    const MultiPayment = await ethers.getContractFactory("MultiPayment");
    const multiPayment = await MultiPayment.deploy();

    await multiPayment.waitForDeployment();

    console.log("MultiPayment deployed to:", await multiPayment.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});