// pitlane-api/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
// Import the config file which acts as our database
const clubsConfig = require('../clubConfig'); 
// Import the Mongoose models (we'll need them for checking seat availability)
const Ticket = require('../models/Ticket'); 
// const User = require('../models/User'); // Not needed for these routes

// --- GET /api/tickets/races/:raceId/stands ---
// Get all grandstands for a specific race
router.get('/races/:raceId/stands', async (req, res) => {
    try {
        const { raceId } = req.params;
        console.log(`[APjI] Fetching stands for race: ${raceId}`);

        // --- THIS IS THE INTEGRATION ---
        // Filter the config file to only return entries that are stands
        // We differentiate by checking for the 'price' key
        const standList = Object.keys(clubsConfig)
            .map(id => ({
                id: id,
                ...clubsConfig[id] // Spread all properties (name, price, color, etc.)
            }))
            .filter(entry => 
                // Only include entries that are stands (have a 'price')
                // not Fan Clubs (which have 'joinFee')
                entry.price !== undefined 
            ); 
        // --- END INTEGRATION ---

        if (!standList.length) {
             console.warn(`No stands found with a 'price' key in clubConfig.js`);
             return res.json([]); // Send empty array
        }
        
        res.json(standList); // Send the list of stand objects

    } catch (error) {
        console.error(`Error fetching stands for race ${req.params.raceId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve grandstands.' });
    }
});

// --- GET /api/tickets/races/:raceId/stands/:standId/seats ---
// Get seat availability for a specific stand at a specific race
router.get('/races/:raceId/stands/:standId/seats', async (req, res) => {
    try {
        const { raceId, standId } = req.params;
        // Validate standId against our config to prevent NoSQL injection/bad queries
        if (!clubsConfig[standId]) {
            return res.status(404).json({ error: 'Stand not found.' });
        }
        
        console.log(`[API] Fetching seats for race: ${raceId}, stand: ${standId}`);

        // --- LIVE DATABASE QUERY ---
        // Find all tickets in the DB that match this event and section
        const ownedSeats = await Ticket.find({
            'eventDetails.raceId': raceId,
            'seatDetails.section': standId
        }).select('seatDetails.number');
        
        // Create a Set of taken seat numbers for fast lookup
        const takenSeatNumbers = new Set(ownedSeats.map(t => t.seatDetails.number));
        console.log(`[API] Found ${takenSeatNumbers.size} taken seats for ${standId}`);
        // --- END LIVE QUERY ---

        // Generate mock seat grid data, marking them as taken
        const seats = [];
        // TODO: Get totalSeats from config instead of hardcoding
        const totalSeats = 80; // Example total
        for (let i = 1; i <= totalSeats; i++) {
            seats.push({
                id: `${standId}-S${i}`,
                number: i,
                isTaken: takenSeatNumbers.has(i) // Check against the Set
            });
        }

        res.json(seats);

    } catch (error) {
        console.error(`Error fetching seats for ${req.params.raceId}/${req.params.standId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve seat availability.' });
    }
});


// Health check if desired
router.health = async () => ({ ok: true, detail: 'Ticket routes operational' });

module.exports = router;

