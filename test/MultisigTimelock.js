const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Zap testing", function () {
  let MSTL;


  before("Should deploy contracts", async function () {
    [owner, admin1, admin2, admin3] = await ethers.getSigners();

    const MSTLFactory = await ethers.getContractFactory("MultisigTimelock");
    MSTL = await MSTLFactory.deploy([admin1.address, admin2.address, admin3.address], 2);
  });

  it("It should revert queueTransaction from non-admin", async function () {
    const block = await hre.ethers.provider.getBlock("latest");

    await expect(MSTL.connect(owner).queueTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!admin");
    await expect(MSTL.connect(owner).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!admin");
    await expect(MSTL.connect(owner).cancelTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!admin");
  });

  it("It should not allow execution and cancelling before transaction", async function () {
    const block = await hre.ethers.provider.getBlock("latest");

    await expect(MSTL.connect(admin1).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!quorum not reached");
    await expect(MSTL.connect(admin1).cancelTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!not endorced");
  });

  it("It should allow a full transaction flow", async function () {
    const block = await hre.ethers.provider.getBlock("latest");
    // queue admin1
    await expect(MSTL.connect(admin1).queueTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.emit(MSTL, "QueueTransaction");

    // tests
    await expect(MSTL.connect(owner).queueTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!admin");
    await expect(MSTL.connect(admin1).queueTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!already endorced");
    await expect(MSTL.connect(admin1).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!quorum not reached");
    await expect(MSTL.connect(admin2).cancelTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!not endorced");

    // cancel admin1
    await expect(MSTL.connect(admin1).cancelTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.emit(MSTL, "CancelTransaction");
    // tests
    await expect(MSTL.connect(admin1).cancelTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!not endorced");

    // queue admin 2
    await expect(MSTL.connect(admin2).queueTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.emit(MSTL, "QueueTransaction");

    // queue admin 1
    await expect(MSTL.connect(admin1).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!quorum not reached");

    // tests
    await expect(MSTL.connect(admin1).queueTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.emit(MSTL, "QueueTransaction");

    await expect(MSTL.connect(admin1).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
    .to.be.revertedWith("Timelock::executeTransaction: Transaction hasn't surpassed time lock.");

    await network.provider.send("evm_increaseTime", [12 * 60 * 60])
    
    // test
    await expect(MSTL.connect(owner).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.be.revertedWith("!admin");

    // execute!
    await expect(MSTL.connect(admin1).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
      .to.emit(MSTL, "ExecuteTransaction");

    // tests
    await expect(MSTL.connect(admin1).executeTransaction(MSTL.address, 0, "adminLength()", [], block.timestamp + 12 * 60 * 60))
    .to.be.revertedWith("!quorum not reached");


  });
});