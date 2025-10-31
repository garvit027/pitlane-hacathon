// pitlane-api/services/web3Service.js
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import NFT from "../models/NFT.js";

dotenv.config();

// --- Load environment variables ---
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.F1_TICKET_CONTRACT_ADDRESS;

// --- Load Contract ABI ---
let contractABI;
try {
  const abiPath = "./abi/TicketNFT.json";
  const fileContent = fs.readFileSync(abiPath, "utf8");
  const parsed = JSON.parse(fileContent);
  contractABI = parsed.abi || parsed;
  console.log("✅ ABI loaded successfully from:", abiPath);
} catch (err) {
  console.error("❌ Failed to load ABI file:", err.message);
  process.exit(1);
}

// --- Setup Provider & Signer ---
let provider;
try {
  provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  console.log("🌐 Connected to Sepolia RPC successfully");
} catch (err) {
  console.error("❌ Failed to connect to Sepolia RPC:", err.message);
  process.exit(1);
}

// --- Validate Private Key ---
if (!PRIVATE_KEY || PRIVATE_KEY.length < 64) {
  console.error("❌ Invalid PRIVATE_KEY in .env");
  process.exit(1);
}

// --- Setup Wallet ---
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
console.log("🔑 Wallet initialized:", wallet.address);

// --- Initialize Contract ---
if (!CONTRACT_ADDRESS) {
  console.error("❌ CONTRACT_ADDRESS is undefined. Please check your .env file.");
  process.exit(1);
}
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
console.log("🎯 Connected to contract:", CONTRACT_ADDRESS);

// ======================================================
// 🪙 Mint NFT Function
// ======================================================
export async function mintNFT(toAddress, tokenURI) {
  try {
    console.log("🚀 Minting NFT...");
    console.log("Recipient:", toAddress);
    console.log("Metadata URI:", tokenURI);

    const tx = await contract.mintTicket(toAddress, tokenURI);
    console.log("📦 Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    const tokenIdTopic = receipt.logs[0]?.topics?.[3];
    const tokenId = tokenIdTopic ? parseInt(tokenIdTopic, 16) : null;

    console.log("🎫 Minted Token ID:", tokenId);

    // Save NFT data to MongoDB
    if (tokenId !== null) {
      await NFT.create({
        tokenId,
        owner: toAddress,
        tokenURI,
        txHash: tx.hash,
      });
      console.log("💾 NFT saved to database!");
    }

    return {
      success: true,
      txHash: tx.hash,
      tokenId,
    };
  } catch (error) {
    console.error("❌ Minting failed:", error);
    throw new Error(`Minting failed: ${error.message}`);
  }
}
