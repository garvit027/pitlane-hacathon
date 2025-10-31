// pitlane-api/models/Ticket.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TicketSchema = new mongoose.Schema({
    tokenId: {
        type: Number, // Assuming tokenId is a number from the contract counter
        required: true,
        unique: true, // Each tokenId should be unique
        index: true
    },
    ownerAddress: { // Wallet address of the current owner
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    contractAddress: { // Address of the specific F1Ticket contract
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    tokenURI: { // Metadata URI associated with this ticket
        type: String,
        required: true,
        trim: true
    },
    eventDetails: { // Denormalized event info for easier querying
        raceId: { type: String, required: true, index: true }, // e.g., 'monaco-2025'
        name: { type: String, required: true }, // e.g., 'Monaco Grand Prix 2025'
        circuit: { type: String },
        date: { type: Date }
    },
    seatDetails: { // Denormalized seat info
        section: { type: String, required: true },
        row: { type: String }, // Can be string or number
        number: { type: Number, required: true }
    },
    mintTransactionHash: { // Transaction hash when the ticket was minted
        type: String,
        unique: true, // Ensure hash uniqueness
        sparse: true // Allow nulls if hash isn't stored immediately
    },
    isListed: { // Flag for marketplace status
        type: Boolean,
        default: false,
        index: true
    },
    listingPrice: { // Current listing price (in Wei string or Decimal128)
        type: String // Store as string to handle large numbers
        // Or use mongoose.Schema.Types.Decimal128 for precision
    }
}, {
    timestamps: true // createdAt (mint time), updatedAt (listing/transfer time)
});

// Compound index for finding tickets by owner and event
TicketSchema.index({ ownerAddress: 1, 'eventDetails.raceId': 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
