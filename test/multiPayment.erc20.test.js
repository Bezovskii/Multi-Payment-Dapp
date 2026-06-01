const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MultiPayment ERC20", function () {
    const TOKEN_AMOUNT = 1_000_000n; // 1 token with 6 decimals
    const ORDER_ID = 1;

    async function deployFixture() {
        const [owner, arbitrator, buyer, seller, other] = await ethers.getSigners();

        const MultiPayment = await ethers.getContractFactory("MultiPayment");
        const multiPayment = await MultiPayment.deploy(arbitrator.address);
        await multiPayment.waitForDeployment();

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const token = await MockERC20.deploy();
        await token.waitForDeployment();

        await token.mint(buyer.address, TOKEN_AMOUNT * 100n);

        return {
            multiPayment,
            token,
            owner,
            arbitrator,
            buyer,
            seller,
            other,
        };
    }

    async function createERC20EscrowFixture() {
        const fixture = await deployFixture();

        await fixture.token
            .connect(fixture.buyer)
            .approve(await fixture.multiPayment.getAddress(), TOKEN_AMOUNT);

        await fixture.multiPayment
            .connect(fixture.buyer)
            .createERC20EscrowPayment(
                fixture.seller.address,
                await fixture.token.getAddress(),
                TOKEN_AMOUNT
            );

        return fixture;
    }

    it("creates ERC20 direct payment", async function () {
        const { multiPayment, token, buyer, seller } =
            await loadFixture(deployFixture);

        await token
            .connect(buyer)
            .approve(await multiPayment.getAddress(), TOKEN_AMOUNT);

        await multiPayment
            .connect(buyer)
            .createERC20DirectPayment(
                seller.address,
                await token.getAddress(),
                TOKEN_AMOUNT
            );

        expect(await token.balanceOf(seller.address)).to.equal(TOKEN_AMOUNT);

        const order = await multiPayment.orderById(ORDER_ID);

        expect(order.buyer).to.equal(buyer.address);
        expect(order.seller).to.equal(seller.address);
        expect(order.token).to.equal(await token.getAddress());
        expect(order.amount).to.equal(TOKEN_AMOUNT);
        expect(order.paymentType).to.equal(0); // Direct
        expect(order.status).to.equal(2); // Completed
        expect(order.exists).to.equal(true);
    });

    it("creates ERC20 escrow payment and holds tokens in contract", async function () {
        const { multiPayment, token } =
            await loadFixture(createERC20EscrowFixture);

        expect(await token.balanceOf(await multiPayment.getAddress())).to.equal(
            TOKEN_AMOUNT
        );

        const order = await multiPayment.orderById(ORDER_ID);

        expect(order.token).to.equal(await token.getAddress());
        expect(order.status).to.equal(0); // InEscrow
    });

    it("reverts ERC20 direct payment if allowance is too low", async function () {
        const { multiPayment, token, buyer, seller } =
            await loadFixture(deployFixture);

        await expect(
            multiPayment
                .connect(buyer)
                .createERC20DirectPayment(
                    seller.address,
                    await token.getAddress(),
                    TOKEN_AMOUNT
                )
        ).to.be.revertedWith("allowance too low");
    });

    it("reverts ERC20 escrow payment if balance is too low", async function () {
        const { multiPayment, token, seller, other } =
            await loadFixture(deployFixture);

        await token
            .connect(other)
            .approve(await multiPayment.getAddress(), TOKEN_AMOUNT);

        await expect(
            multiPayment
                .connect(other)
                .createERC20EscrowPayment(
                    seller.address,
                    await token.getAddress(),
                    TOKEN_AMOUNT
                )
        ).to.be.revertedWith("balance too low");
    });

    it("confirms ERC20 escrow and releases tokens to seller", async function () {
        const { multiPayment, token, buyer, seller } =
            await loadFixture(createERC20EscrowFixture);

        await multiPayment.connect(buyer).confirmReceipt(ORDER_ID);

        expect(await token.balanceOf(seller.address)).to.equal(TOKEN_AMOUNT);

        const order = await multiPayment.orderById(ORDER_ID);
        expect(order.status).to.equal(2); // Completed
    });

    it("seller refunds ERC20 escrow to buyer", async function () {
        const { multiPayment, token, buyer, seller } =
            await loadFixture(createERC20EscrowFixture);

        const buyerBefore = await token.balanceOf(buyer.address);

        await multiPayment.connect(seller).refund(ORDER_ID);

        const buyerAfter = await token.balanceOf(buyer.address);

        expect(buyerAfter - buyerBefore).to.equal(TOKEN_AMOUNT);

        const order = await multiPayment.orderById(ORDER_ID);
        expect(order.status).to.equal(3); // Refunded
    });

    it("opens dispute for ERC20 escrow", async function () {
        const { multiPayment, buyer } =
            await loadFixture(createERC20EscrowFixture);

        await multiPayment.connect(buyer).openDispute(ORDER_ID);

        const order = await multiPayment.orderById(ORDER_ID);
        expect(order.status).to.equal(1); // Disputed
    });

    it("arbitrator resolves ERC20 dispute to seller", async function () {
        const { multiPayment, token, buyer, seller, arbitrator } =
            await loadFixture(createERC20EscrowFixture);

        await multiPayment.connect(buyer).openDispute(ORDER_ID);

        await multiPayment.connect(arbitrator).resolveDispute(ORDER_ID, true);

        expect(await token.balanceOf(seller.address)).to.equal(TOKEN_AMOUNT);

        const order = await multiPayment.orderById(ORDER_ID);
        expect(order.status).to.equal(2); // Completed
    });

    it("arbitrator resolves ERC20 dispute to buyer", async function () {
        const { multiPayment, token, buyer, arbitrator } =
            await loadFixture(createERC20EscrowFixture);

        const buyerBefore = await token.balanceOf(buyer.address);

        await multiPayment.connect(buyer).openDispute(ORDER_ID);

        await multiPayment.connect(arbitrator).resolveDispute(ORDER_ID, false);

        const buyerAfter = await token.balanceOf(buyer.address);

        expect(buyerAfter - buyerBefore).to.equal(TOKEN_AMOUNT);

        const order = await multiPayment.orderById(ORDER_ID);
        expect(order.status).to.equal(3); // Refunded
    });
});