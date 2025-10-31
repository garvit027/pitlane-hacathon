import { 
    // Fix: Removed 'BigNumber' which is obsolete in Ethers v6.
    Wallet, 
    Contract, 
    JsonRpcProvider, 
    // Fix: Removed 'utils' as it is no longer a named export in Ethers v6.
} from 'ethers';
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

// Load environment variables from .env file
dotenv.config();

// --- CONFIGURATION ---
const RPC_URL = process.env.RPC_URL;
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const TICKET_CONTRACT_ADDRESS = process.env.TICKET_CONTRACT_ADDRESS;
const TICKET_PRICE_WEI = process.env.TICKET_PRICE_WEI;

// How many simultaneous ticket purchases the bot should attempt
const CONCURRENT_ATTEMPTS = 50; 

// The function on your smart contract that mints/buys a ticket
const BUY_TICKET_FUNCTION = 'buyTicket'; 

// Minimal ABI required to interact with the contract's specific function
const TICKET_CONTRACT_ABI = [
    // Replace 'address _recipient' and 'uint256 _quantity' with your actual function signature
    `function ${BUY_TICKET_FUNCTION}() payable` 
];

// --- BOT CLASS ---

class ScalpingBot {
    constructor(botId, provider, wallet) {
        this.id = botId;
        this.provider = provider;
        this.wallet = wallet;
        // Use the explicitly imported Contract class
        this.contract = new Contract(TICKET_CONTRACT_ADDRESS, TICKET_CONTRACT_ABI, wallet);
        console.log(`[Bot ${this.id}] Initialized with wallet: ${wallet.address}`);
    }

    /**
     * Simulates the non-human, instant transaction attempt.
     * This is the core attack vector your "PitLane Guard" should stop.
     */
    async attemptPurchase() {
        console.log(`[Bot ${this.id}] Attempting instant purchase...`);
        try {
            // 1. Simulating a malicious attempt to front-run by using high gas settings
            const feeData = await this.provider.getFeeData();
            
            // Check for EIP-1559 support (maxFeePerGas) or fallback to legacy (gasPrice)
            let txParams = {
                value: TICKET_PRICE_WEI, // The cost of the ticket (as string, will be coerced to BigInt by ethers)
                gasLimit: 300000, // Safe gas limit
            };

            // Ethers v6 uses BigInts for fees. The properties returned by getFeeData are already BigInts.
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                // EIP-1559 logic: double the priority fee for front-running
                // In JS, BigInt multiplication uses 'n' notation.
                const inflatedPriorityFee = feeData.maxPriorityFeePerGas * 2n;
                
                // Double the base fee too (using BigInt multiplication)
                txParams.maxFeePerGas = feeData.maxFeePerGas * 2n; 
                txParams.maxPriorityFeePerGas = inflatedPriorityFee;
            } else if (feeData.gasPrice) {
                // Legacy logic: double the gas price for front-running
                // Use BigInt conversion and multiplication
                const inflatedGasPrice = feeData.gasPrice * 2n; 
                txParams.gasPrice = inflatedGasPrice;
            } else {
                // If neither is available, try to proceed without explicit gas prices (risky)
                console.warn(`[Bot ${this.id}] Warning: Could not fetch gas price data. Proceeding without explicit gas settings.`);
            }

            // 2. Prepare and send the transaction
            const tx = await this.contract[BUY_TICKET_FUNCTION](txParams);
            
            console.log(`[Bot ${this.id}] Transaction sent! Hash: ${tx.hash}`);

            // Wait for the transaction to be mined (this will either confirm success or show a contract revert)
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`[Bot ${this.id}] ✅ SUCCESS! Ticket Minted in block ${receipt.blockNumber}.`);
            } else {
                console.log(`[Bot ${this.id}] ❌ FAIL (Reverted)! Transaction failed in block ${receipt.blockNumber}.`);
            }

            return { success: receipt.status === 1, hash: tx.hash };

        } catch (error) {
            // This catches transaction rejections *before* they are sent to the network (e.g., if the contract blocks it locally).
            if (error.code === 'CALL_EXCEPTION' || error.code === 'UNPREDICTABLE_GAS_LIMIT') {
                console.log(`[Bot ${this.id}] 🛑 FAILED: Transaction blocked by Smart Contract or RPC (Expected Bot Detection).`);
            } else if (error.message.includes('insufficient funds')) {
                console.log(`[Bot ${this.id}] 🚨 FAILED: Wallet has insufficient funds for gas/ticket price.`);
            } else {
                console.log(`[Bot ${this.id}] ⚠️ FAILED: Unknown Error during transaction attempt: ${error.message}`);
                console.log(`Full Error: ${error.code} - ${error.message}`);
            }
            return { success: false, hash: null, error: error.message };
        }
    }
}

// --- MAIN EXECUTION ---

async function runHackathonBotTest() {
    if (!RPC_URL || !BOT_PRIVATE_KEY || !TICKET_CONTRACT_ADDRESS || !TICKET_PRICE_WEI) {
        console.error("Please fill out all variables in the .env file.");
        return;
    }

    // Initialize Ethers Provider
    // Fix: Using JsonRpcProvider directly (imported above)
    const provider = new JsonRpcProvider(RPC_URL);

    // Initialize the main bot wallet
    const botWallet = new Wallet(BOT_PRIVATE_KEY, provider);

    console.log(`\n--- Starting Web3 Scalping Bot Test ---`);
    console.log(`Target Contract: ${TICKET_CONTRACT_ADDRESS}`);
    console.log(`Bot Wallet Address: ${botWallet.address}`);
    console.log(`Attempting ${CONCURRENT_ATTEMPTS} purchases in parallel.\n`);

    const botPromises = [];

    // Create and run multiple bot instances concurrently
    for (let i = 1; i <= CONCURRENT_ATTEMPTS; i++) {
        const bot = new ScalpingBot(i, provider, botWallet);
        
        // Use a slight delay to avoid overwhelming the local RPC connection immediately
        await setTimeout(i * 10); 
        
        botPromises.push(bot.attemptPurchase());
    }

    const results = await Promise.all(botPromises.map(p => p.catch(e => e)));

    const successfulAttempts = results.filter(r => r.success).length;
    const failedAttempts = results.length - successfulAttempts;

    console.log(`\n--- Test Summary ---`);
    console.log(`Total Attempts: ${CONCURRENT_ATTEMPTS}`);
    console.log(`Successful Purchases: ${successfulAttempts}`);
    console.log(`Blocked/Failed Attempts: ${failedAttempts}`);
    
    if (successfulAttempts > 0) {
        console.warn(`\n!! WARNING !! The bot successfully purchased ${successfulAttempts} tickets.`);
        console.warn('If your system limits purchases (e.g., 1 per wallet), this indicates a weakness.');
    } else {
        console.log(`\n🎉 GREAT JOB! All attempts were blocked or failed. Your system may be bot-proof.`);
    }
}

runHackathonBotTest();
