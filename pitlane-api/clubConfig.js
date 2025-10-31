// This file acts as our "database" for Fan Clubs and Stand info.
// The backend's /api/clubs and /api/tickets routes will read from this.

const clubs = {
    // --- Fan Club NFTs ---
    // These are used by clubAuthMiddleware.js
    "ferrari": {
        name: "Ferrari Fan Club",
        contractAddress: process.env.FERRARI_NFT_ADDRESS || "0xYOUR_FERRARI_NFT_ADDRESS",
        icon: "🐎",
        color: "#DC0000",
        description: "For the passionate Tifosi community",
        joinFee: 0.05,
        perks: [
            "Exclusive Ferrari merchandise",
            "Private chat channel",
            "Voting rights on team decisions"
        ]
    },
    "mclaren": {
        name: "McLaren Paddock Club",
        contractAddress: process.env.MCLAREN_NFT_ADDRESS || "0xYOUR_MCLAREN_NFT_ADDRESS",
        icon: "🍊",
        color: "#FF8700",
        description: "The papaya family - join McLaren fans worldwide",
        joinFee: 0.03,
        perks: ["McLaren garage tour access", "Meet & greet with team personnel", "Technical insights"]
    },
    "mercedes": {
        name: "Mercedes AMG Lounge",
        contractAddress: process.env.MERCEDES_NFT_ADDRESS || "0xYOUR_MERCEDES_NFT_ADDRESS",
        icon: "⭐",
        color: "#00D2BE",
        description: "Join the Silver Arrows elite fan community",
        joinFee: 0.04,
        perks: ["Priority grandstands", "Factory tour invites", "Driver Q&A"]
    },
    // ... add all other teams (Red Bull, Aston Martin, etc.)
    
    // --- SVG Grandstand Sections ---
    // This data is used by ticketRoutes.js
    // The ID (e.g., 'A', 'M') MUST match the 'standId' in StadiumView.jsx
    "A": {
        name: "Sector A",
        price: 0.05,
        color: "#CDF2A6",
        nonClickable: false
    },
    "B": {
        name: "Sector B (Pit Stop)",
        price: 0.2,
        color: "#FFFFFF",
        nonClickable: true // Example: Make Pit Stop non-clickable
    },
    "M": {
        name: "Sector M",
        price: 0.04,
        color: "#CDF2A6",
        nonClickable: false
    },
    "G_OrangeTree": {
        name: "Orange Tree Club",
        price: 0.08,
        color: "#CDF2A6",
        nonClickable: false
    },
    "D": {
        name: "Sector D",
        price: 0.04,
        color: "#CDF2A6",
        nonClickable: false
    },
    "H": {
        name: "Sector H",
        price: 0.06,
        color: "#CDF2A6",
        nonClickable: false
    },
    "N": {
        name: "Sector N",
        price: 0.03,
        color: "#FFFFFF",
        nonClickable: true
    },
    "R": {
        name: "Sector R",
        price: 0.05,
        color: "#CDF2A6",
        nonClickable: false
    },
    "G_Main": {
        name: "Sector G (Main)",
        price: 0.07,
        color: "#CDF2A6",
        nonClickable: false
    },
    "S": {
        name: "Sector S",
        price: 0.03,
        color: "#FFFFFF",
        nonClickable: true
    },
    "V": {
        name: "Sector V",
        price: 0.03,
        color: "#FFFFFF",
        nonClickable: true
    },
    "GRANDPRIXCLUB": {
        name: "Grand Prix Club",
        price: 0.15,
        color: "#4c9103",
        nonClickable: false
    },
    "HEINEKEN": {
        name: "Heineken Village",
        price: 0.1,
        color: "#CDF2A6",
        nonClickable: false
    },
    "PITSTOP": {
        name: "Pit Stop Club",
        price: 0.2,
        color: "#FFFFFF",
        nonClickable: true
    }
    // ... Add P, I, etc.
};

module.exports = clubs;

