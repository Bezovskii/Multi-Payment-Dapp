const { ethers } = require("hardhat");

async function deployMultiPaymentFixture() {
    const [owner, buyer, seller, other] = await ethers.getSigners();

    const MultiPayment = await ethers.getContractFactory("MultiPayment");

    const multiPayment = await MultiPayment.deploy();
    await multiPayment.waitForDeployment();

    return {
        multiPayment,
        owner,
        buyer,
        seller,
        other,
    };
}

module.exports = {
    deployMultiPaymentFixture,
};