import express from "express";
import { mintTicket } from "../services/web3Service.js";
import Ticket from "../models/Ticket.js"; // your DB model

const router = express.Router();

router.post("/mint-ticket", async (req, res) => {
  try {
    const { walletAddress, uri } = req.body;

    if (!walletAddress || !uri)
      return res.status(400).json({ error: "Missing parameters" });

    const mintResult = await mintTicket(walletAddress, uri);

    const newTicket = new Ticket({
      walletAddress,
      uri,
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.txHash,
      timestamp: new Date(),
    });
    await newTicket.save();

    res.status(200).json({
      message: "NFT minted successfully",
      ...mintResult,
    });
  } catch (err) {
    console.error("Mint ticket API error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
