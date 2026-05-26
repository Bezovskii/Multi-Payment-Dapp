const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MultiPayment Dispute System", function () {
    const ONE_ETH = ethers.parseEther("1");
    const FIRST_ORDER_ID = 1;

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

    async function createEscrowFixture() {
        const fixture = await deployMultiPaymentFixture();

        await fixture.multiPayment
            .connect(fixture.buyer)
            .createEscrowPayment(fixture.seller.address, {
                value: ONE_ETH,
            });

        return fixture;
    }

    describe("deployment", function () {
        it("sets the arbitrator correctly", async function () {
            const { multiPayment, arbitrator } =
                await loadFixture(deployMultiPaymentFixture);

            expect(await multiPayment.arbitrator()).to.equal(arbitrator.address);
        });

        it("reverts if arbitrator is zero address", async function () {
            const MultiPayment = await ethers.getContractFactory("MultiPayment");

            await expect(
                MultiPayment.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("invalid arbitrator");
        });
    });

    describe("openDispute", function () {
        it("buyer can open dispute", async function () {
            const { multiPayment, buyer } =
                await loadFixture(createEscrowFixture);

            await expect(
                multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID)
            )
                .to.emit(multiPayment, "DisputeOpened")
                .withArgs(FIRST_ORDER_ID, buyer.address);

            const order = await multiPayment.orderById(FIRST_ORDER_ID);

            expect(order.status).to.equal(1); // Disputed
        });

        it("seller can open dispute", async function () {
            const { multiPayment, seller } =
                await loadFixture(createEscrowFixture);

            await expect(
                multiPayment.connect(seller).openDispute(FIRST_ORDER_ID)
            )
                .to.emit(multiPayment, "DisputeOpened")
                .withArgs(FIRST_ORDER_ID, seller.address);

            const order = await multiPayment.orderById(FIRST_ORDER_ID);

            expect(order.status).to.equal(1); // Disputed
        });

        it("reverts if random address tries to open dispute", async function () {
            const { multiPayment, other } =
                await loadFixture(createEscrowFixture);

            await expect(
                multiPayment.connect(other).openDispute(FIRST_ORDER_ID)
            ).to.be.revertedWith("only participant");
        });

        it("reverts if order does not exist", async function () {
            const { multiPayment, buyer } =
                await loadFixture(deployMultiPaymentFixture);

            await expect(
                multiPayment.connect(buyer).openDispute(999)
            ).to.be.revertedWith("order does not exist");
        });

        it("reverts if payment type is direct", async function () {
            const { multiPayment, buyer, seller } =
                await loadFixture(deployMultiPaymentFixture);

            await multiPayment
                .connect(buyer)
                .createDirectPayment(seller.address, {
                    value: ONE_ETH,
                });

            await expect(
                multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID)
            ).to.be.revertedWith("only escrow");
        });

        it("reverts if order is already completed", async function () {
            const { multiPayment, buyer } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID);

            await expect(
                multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID)
            ).to.be.revertedWith("not in escrow");
        });

        it("reverts if order is already refunded", async function () {
            const { multiPayment, seller } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(seller).refund(FIRST_ORDER_ID);

            await expect(
                multiPayment.connect(seller).openDispute(FIRST_ORDER_ID)
            ).to.be.revertedWith("not in escrow");
        });
    });

    describe("resolveDispute", function () {
        it("arbitrator can resolve dispute to seller", async function () {
            const { multiPayment, buyer, seller, arbitrator } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID);

            await expect(
                multiPayment
                    .connect(arbitrator)
                    .resolveDispute(FIRST_ORDER_ID, true)
            )
                .to.emit(multiPayment, "DisputeResolved")
                .withArgs(FIRST_ORDER_ID, arbitrator.address, true, ONE_ETH);

            const order = await multiPayment.orderById(FIRST_ORDER_ID);

            expect(order.status).to.equal(2); // Completed
        });

        it("arbitrator can resolve dispute to buyer", async function () {
            const { multiPayment, buyer, arbitrator } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID);

            await expect(
                multiPayment
                    .connect(arbitrator)
                    .resolveDispute(FIRST_ORDER_ID, false)
            )
                .to.emit(multiPayment, "DisputeResolved")
                .withArgs(FIRST_ORDER_ID, arbitrator.address, false, ONE_ETH);

            const order = await multiPayment.orderById(FIRST_ORDER_ID);

            expect(order.status).to.equal(3); // Refunded
        });

        it("reverts if non-arbitrator tries to resolve", async function () {
            const { multiPayment, buyer, other } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID);

            await expect(
                multiPayment.connect(other).resolveDispute(FIRST_ORDER_ID, true)
            ).to.be.revertedWith("not arbitrator");
        });

        it("reverts if resolving non-disputed order", async function () {
            const { multiPayment, arbitrator } =
                await loadFixture(createEscrowFixture);

            await expect(
                multiPayment
                    .connect(arbitrator)
                    .resolveDispute(FIRST_ORDER_ID, true)
            ).to.be.revertedWith("not disputed");
        });

        it("reverts if order does not exist", async function () {
            const { multiPayment, arbitrator } =
                await loadFixture(deployMultiPaymentFixture);

            await expect(
                multiPayment.connect(arbitrator).resolveDispute(999, true)
            ).to.be.revertedWith("order does not exist");
        });
    });

    describe("disputed state protection", function () {
        it("reverts confirmReceipt after dispute is opened", async function () {
            const { multiPayment, buyer } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID);

            await expect(
                multiPayment.connect(buyer).confirmReceipt(FIRST_ORDER_ID)
            ).to.be.revertedWith("not in escrow");
        });

        it("reverts refund after dispute is opened", async function () {
            const { multiPayment, buyer, seller } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID);

            await expect(
                multiPayment.connect(seller).refund(FIRST_ORDER_ID)
            ).to.be.revertedWith("not in escrow");
        });

        it("cannot resolve the same dispute twice", async function () {
            const { multiPayment, buyer, arbitrator } =
                await loadFixture(createEscrowFixture);

            await multiPayment.connect(buyer).openDispute(FIRST_ORDER_ID);

            await multiPayment
                .connect(arbitrator)
                .resolveDispute(FIRST_ORDER_ID, true);

            await expect(
                multiPayment
                    .connect(arbitrator)
                    .resolveDispute(FIRST_ORDER_ID, false)
            ).to.be.revertedWith("not disputed");
        });
    });
});