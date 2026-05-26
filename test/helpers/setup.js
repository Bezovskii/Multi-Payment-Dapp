const { ethers } = require("hardhat");

async function deployMultiPaymentFixture() {
    const [owner, arbitrator, buyer, seller, other] =
        await ethers.getSigners();

    const MultiPayment = await ethers.getContractFactory("MultiPayment");

    const multiPayment = await MultiPayment.deploy(arbitrator.address);

    await multiPayment.waitForDeployment();

    return {
        multiPayment,
        owner,
        arbitrator,
        buyer,
        seller,
        other,
    };
}

module.exports = {
    deployMultiPaymentFixture,
};