const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    deployMultiPaymentFixture,
} = require("./helpers/setup");

describe("refund", function () {
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
        const { multiPayment, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(seller).refund(999)
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
            multiPayment.connect(seller).refund(FIRST_ORDER_ID)
        ).to.be.revertedWith("only escrow");
    });

    it("reverts if caller is not seller", async function () {
        const { multiPayment, buyer } =
            await createEscrow();

        await expect(
            multiPayment.connect(buyer).refund(FIRST_ORDER_ID)
        ).to.be.revertedWith("only seller can refund");
    });
    it("reverts when refunding twice", async function () {
        const { multiPayment, seller } =
            await createEscrow();

        await multiPayment
            .connect(seller)
            .refund(FIRST_ORDER_ID);

        await expect(
            multiPayment.connect(seller).refund(FIRST_ORDER_ID)
        ).to.be.revertedWith("not in escrow");
    });

    it("refunds buyer, marks order refunded, and keeps order existing", async function () {
        const { multiPayment, seller, buyer } =
            await createEscrow();

        await expect(
            multiPayment.connect(seller).refund(FIRST_ORDER_ID)
        ).to.changeEtherBalances(
            [buyer, multiPayment],
            [ONE_ETH, -ONE_ETH]
        );

        const refundedOrder =
            await multiPayment.orderById(FIRST_ORDER_ID);

        expect(refundedOrder.exists).to.equal(true);
        expect(refundedOrder.status).to.equal(3); // Refunded
        expect(refundedOrder.paymentType).to.equal(1); // Escrow
        expect(refundedOrder.buyer).to.equal(buyer.address);
        expect(refundedOrder.seller).to.equal(seller.address);
        expect(refundedOrder.amount).to.equal(ONE_ETH);
    });

    it("emits EscrowPaymentRefunded", async function () {
        const { multiPayment, seller, buyer } =
            await createEscrow();

        await expect(
            multiPayment.connect(seller).refund(FIRST_ORDER_ID)
        )
            .to.emit(multiPayment, "EscrowPaymentRefunded")
            .withArgs(
                FIRST_ORDER_ID,
                buyer.address,
                seller.address,
                ONE_ETH
            );
    });
});