// pitlane-api/scripts/mint-ticket.js
const hre = require("hardhat");
require('dotenv').config();

// --- Configuration ---
const CONTRACT_ADDRESS = process.env.F1_TICKET_CONTRACT_ADDRESS; // Get address from .env

async function main() {
  // --- Input Validation ---
  if (!CONTRACT_ADDRESS || !hre.ethers.utils.isAddress(CONTRACT_ADDRESS)) {
    console.error("❌ Error: F1_TICKET_CONTRACT_ADDRESS is missing or invalid in your .env file.");
    console.error("   Please deploy the contract first ('npx hardhat run scripts/deploy.js --network sepolia')");
    console.error("   and add the address to your .env file.");
    process.exit(1);
  }

  // Get recipient address and metadata URI from command line arguments
  // Example usage: npx hardhat run scripts/mint-ticket.js --network sepolia --to 0xRecipientAddress --uri ipfs://YourMetadataURI
  const recipientAddress = hre.hardhatArguments.to;
  const metadataURI = hre.hardhatArguments.uri;

  if (!recipientAddress || !hre.ethers.utils.isAddress(recipientAddress)) {
    console.error("❌ Error: Please provide a valid recipient address using --to <address>");
    console.log("   Example: npx hardhat run scripts/mint-ticket.js --network sepolia --to 0x123...");
    process.exit(1);
  }

  if (!metadataURI || typeof metadataURI !== 'string' || metadataURI.trim() === '') {
    console.error("❌ Error: Please provide a metadata URI using --uri <uri>");
     console.log("   Example: npx hardhat run scripts/mint-ticket.js --network sepolia --to 0x... --uri ipfs://CID");
    process.exit(1);
  }

  // --- Get Signer & Contract Instance ---
  const [deployer] = await hre.ethers.getSigners(); // Uses the private key configured for the network in hardhat.config.js
  console.log(`Minting ticket using owner account: ${deployer.address}`);

  // Get the deployed contract instance
  // We need the ABI, Hardhat finds it automatically after compilation if names match
  const F1Ticket = await hre.ethers.getContractFactory("F1Ticket");
  const f1TicketContract = F1Ticket.attach(CONTRACT_ADDRESS);

  console.log(`\nAttempting to mint 1 ticket to: ${recipientAddress}`);
  console.log(`Metadata URI: ${metadataURI}`);

  // --- Call the Mint Function ---
  try {
    const tx = await f1TicketContract.mintTicket(recipientAddress, metadataURI);
    console.log("Transaction sent! Hash:", tx.hash);

    console.log("Waiting for transaction confirmation...");
    const receipt = await tx.wait(); // Wait for the transaction to be mined

    // Find the emitted event to get the tokenId (more robust than relying on counter)
    let tokenId = "unknown";
    const mintEvent = receipt.events?.find(e => e.event === 'TicketMinted');
    if (mintEvent && mintEvent.args) {
        tokenId = mintEvent.args.tokenId.toString();
    } else {
        // Fallback or attempt to read counter if event not found/parsed
        console.warn("Could not find TicketMinted event in transaction receipt. Token ID might be inaccurate if multiple mints occurred.");
        // const currentCounter = await f1TicketContract._tokenIdCounter(); // Need to make counter public or add getter
        // tokenId = currentCounter.toString();
    }


    console.log("✅ Ticket Minted Successfully!");
    console.log(`   Recipient: ${recipientAddress}`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Metadata URI: ${metadataURI}`);
    console.log(`   Transaction Hash: ${receipt.transactionHash}`);
    console.log(`   Block Number: ${receipt.blockNumber}`);

  } catch (error) {
    console.error("\n❌ Error during minting:", error.message);
    if (error.data?.message) { // Check for revert reason
        console.error("   Revert Reason:", error.data.message);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
