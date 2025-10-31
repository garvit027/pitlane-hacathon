// pitlane-api/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure JWT_SECRET is loaded

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Express middleware to verify JWT token.
 * Expects token in "Authorization: Bearer <token>" header.
 * If valid, attaches decoded payload (e.g., { address: '0x...' }) to req.user.
 */
const authMiddleware = (req, res, next) => {
    // 1. Check if JWT_SECRET is configured
    if (!JWT_SECRET || JWT_SECRET.includes('YOUR')) {
        console.error("CRITICAL: JWT_SECRET is not configured correctly in .env!");
        // In development, maybe allow bypassing? In production, always deny.
        return res.status(500).json({ error: 'Authentication system configuration error.' });
        // For development only:
        // console.warn("JWT_SECRET missing, bypassing authMiddleware for development.");
        // req.user = { address: '0xdevelopmentbypass...' }; // Add mock user for dev
        // return next();
    }


    // 2. Get the token from the "Authorization" header
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("Auth Middleware: No Bearer token provided.");
        return res.status(401).json({ error: 'No token provided. Authorization denied.' });
    }

    // Extract the token part
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log("Auth Middleware: Malformed Authorization header.");
        return res.status(401).json({ error: 'Malformed token.' });
    }

    try {
        // 3. Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Attach the decoded payload (containing user info like wallet address) to req.user
        // Ensure the payload has the expected structure (e.g., contains 'address')
        if (!decoded || !decoded.address) {
            console.error("Auth Middleware: Decoded token is missing 'address'. Payload:", decoded);
            return res.status(401).json({ error: 'Invalid token payload.' });
        }

        req.user = decoded; // Contains { address: '0x...' } and maybe userId
        console.log(`Auth Middleware: Token verified for user ${req.user.address}`);

        // 5. Proceed to the next middleware or route handler
        next();

    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            console.log("Auth Middleware: Token expired.");
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            console.log("Auth Middleware: Invalid token.", error.message);
            return res.status(401).json({ error: 'Invalid token.' });
        }
        // Handle other unexpected errors during verification
        console.error("Auth Middleware: Error verifying token:", error);
        res.status(500).json({ error: 'Could not verify token.' });
    }
};

module.exports = { authMiddleware };
