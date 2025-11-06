# 🏎️ Project Pitlane

## Introduction  
**Project Pitlane** is a **futuristic Web3 platform** built for Formula 1 enthusiasts, blending **secure NFT ticketing**, **exclusive club membership**, and **real-time telemetry visualization**.  
Designed with a **dark, high-tech aesthetic** inspired by **F1 carbon-fiber interfaces**, the platform combines **blockchain security**, **high-performance UI animations**, and **real-time backend systems** for an elite digital fan experience.

---

## 🧭 Table of Contents
1. [Features](#features)  
2. [Architecture Overview](#architecture-overview)  
3. [Installation](#installation)  
4. [Usage](#usage)  
5. [Core Functional Pillars](#core-functional-pillars)  
6. [Technical Stack](#technical-stack)  
7. [Security Highlights](#security-highlights)  
8. [Examples](#examples)  
9. [Contributors](#contributors)  
10. [License](#license)  

---

## ✨ Features  
- 🔐 **Secure NFT Ticketing** with anti-bot verification and private blockchain transactions  
- 🧬 **Web3 Identity System** using Sign-in-with-Ethereum (SIWE) and JWT authentication  
- 💨 **High-fidelity motion design** using Framer Motion for dynamic, cinematic UI transitions  
- 🔊 **Real-time scoreboard** with live updates via Socket.IO  
- 🧩 **Modular dual-backend architecture** optimized for scalability and data flow segregation  

---

## 🏗️ Architecture Overview  

| Layer | Description | Key Technologies |
|-------|--------------|------------------|
| **Frontend (Port 3000)** | High-performance React interface with motion-based transitions and wallet integration | React, Framer Motion, Ethers.js, Custom CSS |
| **API Backend (Port 3001)** | Handles authentication, security, and user data | Node.js, Express, MongoDB, JWT |
| **Real-Time Backend (Port 5000)** | Powers live F1 data feeds and chat updates | Node.js, Socket.IO, MongoDB |
| **Blockchain Layer** | Minting and ownership of NFT tickets | Solidity (ERC-721), Hardhat, Sepolia Testnet |

---

## ⚙️ Installation  

```
# Clone repository
git clone https://github.com/your-username/project-pitlane.git
cd project-pitlane

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit values in .env (MongoDB_URI, JWT_SECRET, etc.)

# Run servers
npm run dev        # Runs React frontend
npm run api        # Starts API backend (port 3001)
npm run socket     # Starts real-time backend (port 5000)
```

---

## 🚀 Usage  
1. Connect your Ethereum wallet (MetaMask) to the platform.  
2. Sign in securely via **Sign-In-with-Ethereum (SIWE)**.  
3. Purchase NFT tickets using private, verified blockchain transactions.  
4. View your tickets in **My Garage**, interact with live events, and join **real-time chat and telemetry updates**.

---

## 🧩 Core Functional Pillars  

### 🛡️ Secure Transaction System (Anti-Bot Pipeline)
- **Function:** Built a secure, server-side transaction pipeline ensuring fair NFT ticket sales.  
- **Methodology:**  
  - Integrated **Tenderly** for pre-submission transaction simulation and validation.  
  - Implemented **Flashbots Relay** for private transaction routing to eliminate MEV and front-running risks.  
- **Outcome:** Guaranteed a level playing field where legitimate users are protected from automated exploit attempts.  

---

### 🔐 Web3 Identity & Security
- **Function:** Complete Web3 authentication flow using **Sign-in-with-Ethereum (SIWE)**.  
- **Methodology:**  
  - Wallet signature verified through Node/Express API endpoints (`authRoutes.js`).  
  - JWTs generated post-verification and mapped to MongoDB user records keyed by wallet address.  
- **Outcome:** Seamless, decentralized login flow with verifiable cryptographic security.  

---

### 🎨 High-Fidelity Dynamic User Experience
- **Features:**  
  - **Animated login transition** — fiery rotating wheel with quadrant explosion.  
  - **Flippable NFT Ticket Cards**, **Paddock License modals**, and **SVG-based interactive track map zoom**.  
- **Implementation:**  
  - Built with **Framer Motion** for fluid animations.  
  - Optimized rendering pipeline for performance on GPU-accelerated browsers.  

---

### ⚡ Data Synchronization & Scalability
- **Architecture:** Two distinct backends for REST (auth/profile) and Socket.IO (real-time).  
- **Functionality:**  
  - Supports scalable load distribution and fault isolation.  
  - Delivers synchronized updates for **live user counts** and **scoreboard data**.  

---

## 🧰 Technical Stack  

**Frontend:** React, Framer Motion, Ethers.js (v5), react-router-dom, Custom CSS  
**Backend (API):** Node.js, Express, MongoDB (Mongoose), JWT, CORS  
**Backend (Real-Time):** Node.js, Express, Socket.IO, MongoDB  
**Blockchain:** Solidity (ERC-721), Hardhat, Sepolia Testnet  
**Security & DevOps:** Tenderly, Flashbots, JWT, dotenv  

---

## 🔒 Security Highlights  
- Encrypted API tokens and private routes  
- Anti-bot measures leveraging blockchain transaction simulation  
- Private Flashbots relays to prevent MEV exploitation  
- Secure JWT-based session management  
- Strong CORS configuration and HTTPS enforcement  

---

## 💡 Example Commands  

```
# Run both backend servers concurrently
npm run start:all

# Deploy smart contracts
npx hardhat run scripts/deploy.js --network sepolia

# Simulate transactions (Tenderly)
npx tenderly simulation run
```

---

## 👥 Contributors  
- **Lead Developer / Architect:** Garvit Juneja 
- **Smart Contract Engineer:** Tanush Jain 
- **UI/UX & Motion Design:** Garvit Juneja 

---

## 🧾 License  
This project is made by GARVIT JUNEJA

---

# 💼 Resume Bullet Points

## 🕸️ Decentralized Applications (DApps)
- Engineered a **secure NFT ticketing pipeline** leveraging **Tenderly** and **Flashbots Relay**, eliminating front-running and MEV vulnerabilities.  
- Developed **ERC-721 smart contracts** on **Sepolia Testnet** using **Hardhat**, enabling provably fair NFT minting and ownership verification.  
- Implemented **Sign-in-with-Ethereum (SIWE)** authentication, linking wallet signatures to MongoDB user profiles for decentralized identity management.

---

## ⚙️ Full-Stack & Backend Engineering
- Architected a **dual-backend infrastructure** (REST + Socket.IO) for scalability, modularity, and real-time data flow.  
- Built **JWT-secured APIs** using Node.js/Express for authentication, transaction routing, and user session management.  
- Designed a **data synchronization layer** handling real-time telemetry, chat, and scoreboard events across distributed services.  
- Integrated **pre-transaction blockchain simulations** for enhanced reliability and fairness in NFT mint execution.

---

## 🎨 Frontend Development & UI/UX
- Designed and implemented a **cinematic, dark-mode Web3 interface** using React, Ethers.js, and Framer Motion.  
- Created **high-performance animations** (rotating wheel transitions, flippable NFT cards, SVG zoom maps) optimized for 60fps rendering.  
- Integrated **wallet-based UX flows**, ensuring seamless blockchain interaction with Ethers.js v5.  
- Delivered **responsive, GPU-accelerated visuals** with custom CSS and motion-driven micro-interactions inspired by F1 telemetry aesthetics.  
