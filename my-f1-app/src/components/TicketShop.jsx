import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import ticketABI from "../contracts/F1Ticket.json";
import "./TicketShop.css";


// Page animation
const pageVariants = {
  initial: { opacity: 0, y: "100vh" },
  in: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
  out: { opacity: 0, y: "-100vh", transition: { duration: 0.5 } },
};

// Seat component
const Seat = ({ number, isTaken }) => {
  const [isSelected, setIsSelected] = useState(false);
  const handleClick = () => {
    if (!isTaken) setIsSelected(!isSelected);
  };
  return (
    <div
      className={`seat ${isTaken ? "taken" : ""} ${isSelected ? "selected" : ""}`}
      onClick={handleClick}
    >
      {number}
    </div>
  );
};

export default function TicketShop() {
  const [selectedGrandstand, setSelectedGrandstand] = useState("Main Grandstand");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);

  const contractAddress = "0xD217B3BA3531589DFC1C37A7D6B658be2e4Ae2Aa"; // ✅ Replace with your deployed address

  // ✅ Connect wallet
  const handleConnectWallet = async () => {
  console.log("🔍 Checking MetaMask injection...");
  console.log("window.ethereum:", window.ethereum); // 👈 Add this line

  try {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    setIsWalletConnected(true);
    console.log("✅ Wallet connected:", accounts[0]);
  } catch (error) {
    console.error("❌ Wallet connection failed:", error);
  }
};


  // ✅ Mint NFT Ticket
  const handleMintTicket = async () => {
    console.log("🎟️ Mint button clicked — trying to open MetaMask...");
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected!");
        return;
      }

      // Make sure wallet is connected
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0];
      console.log("🟢 Wallet active:", account);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ticketABI, signer);

      console.log("📦 Contract loaded:", contractAddress);

      // Call mint (update if your contract has params)
      const tx = await contract.mint({
        value: ethers.parseEther("0.5"), // ✅ Example if mint costs 0.5 ETH
      });

      console.log("🚀 Transaction sent:", tx.hash);
      alert("Please confirm the transaction in MetaMask...");

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);
      alert("🎉 Ticket minted successfully!");
    } catch (error) {
      console.error("❌ Mint failed:", error);
      if (error.code === 4001) {
        alert("Transaction rejected by user.");
      } else {
        alert("Mint failed: " + error.message);
      }
    }
  };

  // Dummy seat map
  const seats = [];
  for (let i = 1; i <= 80; i++) {
    seats.push({ number: i, isTaken: Math.random() > 0.8 });
  }

  return (
    <motion.div
      className="ticket-shop-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <div className="ticket-shop-panel">
        <Link to="/" className="back-button">
          ← Back to Pitlane
        </Link>

        <div className="shop-content">
          {/* Seat Map */}
          <div className="seat-map-container">
            <h2>Select Your Seat</h2>
            <p>Grandstand: {selectedGrandstand}</p>
            <div className="screen-indicator">SCREEN</div>
            <div className="seat-grid">
              {seats.map((seat) => (
                <Seat key={seat.number} number={seat.number} isTaken={seat.isTaken} />
              ))}
            </div>
            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat available"></div>Available
              </div>
              <div className="legend-item">
                <div className="seat selected"></div>Selected
              </div>
              <div className="legend-item">
                <div className="seat taken"></div>Taken
              </div>
            </div>
          </div>

          {/* Mint Section */}
          <div className="minting-container">
            <h2>MINT YOUR PASS</h2>
            <p className="modal-subtitle">Monaco Grand Prix 2025</p>

            <div className="form-group">
              <label htmlFor="grandstand">Select Grandstand</label>
              <select
                id="grandstand"
                value={selectedGrandstand}
                onChange={(e) => setSelectedGrandstand(e.target.value)}
              >
                <option value="Main Grandstand">Main Grandstand (Sec. A)</option>
                <option value="Turn 1">Turn 1 (Casino)</option>
                <option value="Swimming Pool">Swimming Pool Complex</option>
                <option value="Rascasse">Rascasse</option>
              </select>
            </div>

            <div className="price-info">
              <p>Total Price:</p>
              <h3>0.5 ETH</h3>
            </div>

            {isWalletConnected ? (
              <button className="action-button mint-button" onClick={handleMintTicket}>
                MINT TICKET
              </button>
            ) : (
              <button className="action-button connect-button" onClick={handleConnectWallet}>
                CONNECT WALLET
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
