// pitlane-api/models/NFT.js
import mongoose from "mongoose";

const nftSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true },
  tokenId: { type: Number, required: true },
  tokenURI: { type: String, required: true },
  txHash: { type: String, required: true },
  mintedAt: { type: Date, default: Date.now },
});

export default mongoose.model("NFT", nftSchema);
