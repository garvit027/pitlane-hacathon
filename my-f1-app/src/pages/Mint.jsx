// File: src/pages/Mint.jsx
import React, { useState } from "react";
import { ethers } from "ethers";

const Mint = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // ✅ Contract Details (Replace with your deployed contract)
  const CONTRACT_ADDRESS = "0xF6540d066f8c3424c3426dD90bf9c79CA5D79370";
  const ABI = [
    "function mintTicket(address to, string memory tokenURI) public returns (uint256)"
  ];

  // ✅ Connect MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected! Please install it first.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const selectedAccount = accounts[0];
      setWallet(selectedAccount);
      setStatus(`✅ Connected: ${selectedAccount}`);
      console.log("Connected wallet:", selectedAccount);
    } catch (err) {
      console.error("MetaMask connection failed:", err);
      setError("MetaMask connection failed. Please try again.");
    }
  };

  // ✅ Mint NFT
  const handleMint = async () => {
    try {
      if (!wallet) {
        alert("Please connect your wallet first!");
        return;
      }

      setLoading(true);
      setError("");
      setStatus("⏳ Minting your NFT...");

      // ✅ Connect to blockchain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      // ✅ Example metadata URI (use your own IPFS/Pinata link)
      const tokenURI = "https://ipfs.io/ipfs/QmExampleMetadataURI";

      console.log("Minting NFT...");
      const tx = await contract.mintTicket(wallet, tokenURI);
      console.log("Transaction sent:", tx.hash);

      setStatus("🚀 Transaction sent, waiting for confirmation...");
      await tx.wait();

      console.log("✅ Mint successful!");
      setTxHash(tx.hash);
      setStatus("🎉 NFT minted successfully!");
      alert("🎉 NFT Minted Successfully!");
    } catch (err) {
      console.error("Mint failed:", err);
      setError(err.reason || err.message || "Minting failed.");
      setStatus("❌ Minting failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-8">
      <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-md w-full text-center border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
          🎟️ Mint Your NFT Ticket
        </h1>

        {/* Wallet Connection */}
        {!wallet ? (
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Connect MetaMask
          </button>
        ) : (
          <p className="text-gray-700 mb-4">
            Connected:{" "}
            <span className="font-mono text-sm text-blue-600">
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </span>
          </p>
        )}

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={loading || !wallet}
          className={`w-full py-2 px-6 rounded-lg mt-4 font-semibold ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white transition duration-200"
          }`}
        >
          {loading ? "Minting..." : "Mint NFT"}
        </button>

        {/* Status Message */}
        {status && (
          <p className="mt-4 text-sm text-gray-700 font-medium">{status}</p>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <p className="mt-4 text-sm">
            View on Etherscan:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {txHash.slice(0, 10)}...
            </a>
          </p>
        )}

        {/* Error Message */}
        {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default Mint;
