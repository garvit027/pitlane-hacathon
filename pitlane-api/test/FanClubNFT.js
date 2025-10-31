const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FanClubNFT", function () {
  async function deployFanClubNFTFixture() {
    const [owner, addr1] = await ethers.getSigners();

    const FanClubNFT = await ethers.getContractFactory("FanClubNFT");
    const fanClubNFT = await FanClubNFT.deploy(
      "FanClubNFT",                   // name
      "FCNFT",                        // symbol
      "https://example.com/token/"    // baseURI (fixed)
    );

    await fanClubNFT.deployed();
    return { fanClubNFT, owner, addr1 };
  }

  it("Should deploy successfully", async function () {
    const { fanClubNFT } = await deployFanClubNFTFixture();
    expect(await fanClubNFT.name()).to.equal("FanClubNFT");
    expect(await fanClubNFT.symbol()).to.equal("FCNFT");
  });

  it("Should mint a new NFT", async function () {
    const { fanClubNFT, addr1 } = await deployFanClubNFTFixture();

    const mintTx = await fanClubNFT.mintMembership(addr1.address, "1.json");
    await mintTx.wait();

    expect(await fanClubNFT.ownerOf(1)).to.equal(addr1.address);

    const uri = await fanClubNFT.tokenURI(1);
    expect(uri).to.equal("https://example.com/token/1.json");
  });

  it("Should pause and unpause transfers", async function () {
    const { fanClubNFT, addr1 } = await deployFanClubNFTFixture();
    await fanClubNFT.mintMembership(addr1.address, "2.json");

    // Pause the contract
    await fanClubNFT.pause();

    await expect(
      fanClubNFT.connect(addr1).transferFrom(addr1.address, fanClubNFT.address, 1)
    ).to.be.revertedWith("Pausable: paused");

    // Unpause again
    await fanClubNFT.unpause();

    // Transfer should now succeed
    await expect(
      fanClubNFT.connect(addr1).transferFrom(addr1.address, fanClubNFT.address, 1)
    ).not.to.be.reverted;
  });
});
