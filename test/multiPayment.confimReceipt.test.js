const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    deployMultiPaymentFixture,
} = require("./helpers/setup");

describe("confirmReceipt", function () {
    const ONE_ETH = ethers.parseEther("1");
    const FIRST_ORDER_ID = 1;

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

    it("reverts if order does not exist", async function () {
        const { multiPayment, buyer } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).confirmReceipt(999)
        ).to.be.revertedWith("order does not exist");
    });

    it("reverts if payment type is not escrow", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await multiPayment
            .connect(buyer)
            .createDirectPayment(
                seller.address,
                { value: ONE_ETH }
            );

        await expect(
            multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID)
        ).to.be.revertedWith("only escrow");
    });

    it("reverts if caller is not buyer", async function () {
        const { multiPayment, other } =
            await createEscrow();

        await expect(
            multiPayment.connect(other).confirmReceipt(FIRST_ORDER_ID)
        ).to.be.revertedWith("only buyer");
    });
    
    it("reverts when confirming twice", async function () {
        const { multiPayment, buyer } =
            await createEscrow();

        await multiPayment
            .connect(buyer)
            .confirmReceipt(FIRST_ORDER_ID);

        await expect(
            multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID)
        ).to.be.revertedWith("not in escrow");
    });

    it("completes escrow, sends ETH to seller, and keeps order existing", async function () {
        const { multiPayment, buyer, seller } =
            await createEscrow();

        await expect(
            multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID)
        ).to.changeEtherBalances(
            [seller, multiPayment],
            [ONE_ETH, -ONE_ETH]
        );

        const completedOrder =
            await multiPayment.orderById(FIRST_ORDER_ID);

        expect(completedOrder.exists).to.equal(true);
        expect(completedOrder.status).to.equal(1); // Completed
        expect(completedOrder.paymentType).to.equal(1); // Escrow
        expect(completedOrder.buyer).to.equal(buyer.address);
        expect(completedOrder.seller).to.equal(seller.address);
        expect(completedOrder.amount).to.equal(ONE_ETH);
    });

    it("emits PaymentReceivedConfirmed", async function () {
        const { multiPayment, buyer, seller } =
            await createEscrow();

        await expect(
            multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID)
        )
            .to.emit(multiPayment, "PaymentReceivedConfirmed")
            .withArgs(
                FIRST_ORDER_ID,
                seller.address,
                buyer.address,
                ONE_ETH
            );
    });
});