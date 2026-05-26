const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    deployMultiPaymentFixture,
} = require("./helpers/setup");

describe("stateTransitions", function () {
    const ONE_ETH = ethers.parseEther("1");
    const TWO_ETH = ethers.parseEther("2");
    const FIRST_ORDER_ID = 1;
    const SECOND_ORDER_ID = 2;

    async function createEscrow() {
        const fixture = await deployMultiPaymentFixture();

        await fixture.multiPayment
            .connect(fixture.buyer)
            .createEscrowPayment(
                fixture.seller.address,
                { value: ONE_ETH }
            );

        return fixture;
    }

    it("reverts refund after completed", async function () {
        const { multiPayment, buyer, seller } = await createEscrow();

        await multiPayment
            .connect(buyer)
            .confirmReceipt(FIRST_ORDER_ID);

        await expect(
            multiPayment.connect(seller).refund(FIRST_ORDER_ID)
        ).to.be.revertedWith("not in escrow");
    });

    it("reverts confirm after refunded", async function () {
        const { multiPayment, buyer, seller } = await createEscrow();

        await multiPayment
            .connect(seller)
            .refund(FIRST_ORDER_ID);

        await expect(
            multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID)
        ).to.be.revertedWith("not in escrow");
    });

    it("keeps multiple escrow orders independent", async function () {
        const { multiPayment, buyer, seller, other } =
            await deployMultiPaymentFixture();

        await multiPayment
            .connect(buyer)
            .createEscrowPayment(
                seller.address,
                { value: ONE_ETH }
            );

        await multiPayment
            .connect(other)
            .createEscrowPayment(
                seller.address,
                { value: TWO_ETH }
            );

        await multiPayment
            .connect(buyer)
            .confirmReceipt(FIRST_ORDER_ID);

        await multiPayment
            .connect(seller)
            .refund(SECOND_ORDER_ID);

        const firstOrder =
            await multiPayment.orderById(FIRST_ORDER_ID);

        const secondOrder =
            await multiPayment.orderById(SECOND_ORDER_ID);

        expect(firstOrder.status).to.equal(2); // Completed
        expect(secondOrder.status).to.equal(3); // Refunded

        expect(firstOrder.amount).to.equal(ONE_ETH);
        expect(secondOrder.amount).to.equal(TWO_ETH);

        expect(firstOrder.buyer).to.equal(buyer.address);
        expect(secondOrder.buyer).to.equal(other.address);
    });
});