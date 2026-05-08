const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    deployMultiPaymentFixture,
} = require("./helpers/setup");

describe("createEscrowPayment", function () {
    const ONE_ETH = ethers.parseEther("1");
    const FIRST_ORDER_ID = 1;

    it("reverts if seller is zero address", async function () {
        const { multiPayment, buyer } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createEscrowPayment(
                ethers.ZeroAddress,
                { value: ONE_ETH }
            )
        ).to.be.revertedWith("invalid seller");
    });

    it("reverts if msg.value is zero", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createEscrowPayment(
                seller.address,
                { value: 0 }
            )
        ).to.be.revertedWith("amount must be more than 0");
    });

    it("creates escrow and keeps ETH inside contract", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createEscrowPayment(
                seller.address,
                { value: ONE_ETH }
            )
        ).to.changeEtherBalances(
            [buyer, seller, multiPayment],
            [-ONE_ETH, 0, ONE_ETH]
        );

        const order = await multiPayment.orderById(FIRST_ORDER_ID);

        expect(order.paymentType).to.equal(1);
        expect(order.status).to.equal(0);
        expect(order.exists).to.equal(true);
    });

    it("emits EscrowPaymentCreated", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createEscrowPayment(
                seller.address,
                { value: ONE_ETH }
            )
        )
            .to.emit(multiPayment, "EscrowPaymentCreated")
            .withArgs(FIRST_ORDER_ID, buyer.address, seller.address, ONE_ETH);
    });
});