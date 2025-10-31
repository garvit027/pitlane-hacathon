// pitlane-api/scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // ✅ Get deployer account
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error("❌ No deployer found. Check your PRIVATE_KEY in the .env file!");
  }

  console.log("✅ Using deployer address:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("💰 Deployer balance:", hre.ethers.utils.formatEther(balance), "ETH\n");

  // --- Deploy F1Ticket Contract ---
  console.log("📦 Deploying F1Ticket contract...");
  const F1Ticket = await hre.ethers.getContractFactory("F1Ticket", deployer);
  const f1Ticket = await F1Ticket.deploy();
  await f1Ticket.deployed();
  console.log("✅ F1Ticket NFT contract deployed to:", f1Ticket.address);

  // --- Deploy TicketMarketplace Contract ---
  console.log("\n📦 Deploying TicketMarketplace contract...");
  const TicketMarketplace = await hre.ethers.getContractFactory("TicketMarketplace", deployer);
  const ticketMarketplace = await TicketMarketplace.deploy(f1Ticket.address);
  await ticketMarketplace.deployed();
  console.log("✅ TicketMarketplace deployed to:", ticketMarketplace.address);

  // --- Deploy FanClubNFT Contract (Ferrari Example) ---
  console.log("\n📦 Deploying FanClubNFT contract (Example: Ferrari)...");
  const FanClubNFT = await hre.ethers.getContractFactory("FanClubNFT", deployer);
  const ferrariClubNFT = await FanClubNFT.deploy(
    "Ferrari Fan Club Pass",
    "FFCP",
    "ipfs://YOUR_FERRARI_BASE_URI/"
  );
  await ferrariClubNFT.deployed();
  console.log("✅ FanClubNFT (Ferrari Example) deployed to:", ferrariClubNFT.address);

  // --- Summary ---
  console.log("\n--- ✅ Deployment Summary ---");
  console.log("F1Ticket Address:", f1Ticket.address);
  console.log("TicketMarketplace Address:", ticketMarketplace.address);
  console.log("FanClubNFT (Ferrari Example) Address:", ferrariClubNFT.address);
  console.log("\nRemember to update your .env file with these addresses!");
  console.log("----------------------------------------------\n");
}

// Run main()
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
