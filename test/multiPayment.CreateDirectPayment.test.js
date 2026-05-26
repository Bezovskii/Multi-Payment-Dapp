const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    deployMultiPaymentFixture,
} = require("./helpers/setup");

describe("createDirectPayment", function () {
    const ONE_ETH = ethers.parseEther("1");
    const FIRST_ORDER_ID = 1;

    it("reverts if seller is zero address", async function () {
        const { multiPayment, buyer } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createDirectPayment(
                ethers.ZeroAddress,
                { value: ONE_ETH }
            )
        ).to.be.revertedWith("invalid seller");
    });

    it("reverts if msg.value is zero", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createDirectPayment(
                seller.address,
                { value: 0 }
            )
        ).to.be.revertedWith("amount must be more than 0");
    });

    it("creates direct payment and transfers ETH to seller", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createDirectPayment(
                seller.address,
                { value: ONE_ETH }
            )
        ).to.changeEtherBalances(
            [buyer, seller, multiPayment],
            [-ONE_ETH, ONE_ETH, 0]
        );
        const order = await multiPayment.orderById(FIRST_ORDER_ID);
        expect(order.buyer).to.equal(buyer.address);
        expect(order.seller).to.equal(seller.address);
        expect(order.amount).to.equal(ONE_ETH);
        expect(order.paymentType).to.equal(0);
        expect(order.status).to.equal(2);
        expect(order.exists).to.equal(true);
    });

    it("emits DirectPaymentCreated", async function () {
        const { multiPayment, buyer, seller } =
            await deployMultiPaymentFixture();

        await expect(
            multiPayment.connect(buyer).createDirectPayment(
                seller.address,
                { value: ONE_ETH }
            )
        )
            .to.emit(multiPayment, "DirectPaymentCreated")
            .withArgs(FIRST_ORDER_ID, buyer.address, seller.address, ONE_ETH);
    });
});