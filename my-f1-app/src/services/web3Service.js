import { ethers } from 'ethers'; // Using v5, as per your package.json

// ✅ Use clean base URL (no trailing /api to avoid duplication)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class Web3Service {
  provider = null;
  signer = null;
  network = 'sepolia'; // Target network

  // --- Helper to get auth token ---
  _getToken() {
    return localStorage.getItem('f1_token');
  }

  // --- Initialize provider and signer (Ethers v5) ---
  async init() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install it to use this feature.");
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();

      const network = await this.provider.getNetwork();
      if (network.chainId !== 11155111) { // Sepolia Chain ID
        await this.switchToSepolia();
        this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      }

      this.signer = this.provider.getSigner();
      console.log("Web3Service initialized. Signer:", await this.signer.getAddress());
      return true;

    } catch (error) {
      console.error("Web3Service init failed:", error);
      this.provider = null;
      this.signer = null;
      throw error;
    }
  }

  // --- Check Flashbots status ---
  async checkFlashbotsStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error("Network response was not ok");
      const healthData = await response.json();
      return healthData?.checks?.flashbotsConfig || { ok: false, detail: 'Health endpoint format error' };
    } catch (error) {
      console.error('Failed to check Flashbots status:', error);
      return { ok: false, detail: 'Cannot reach backend health service' };
    }
  }

  // --- Check Tenderly status ---
  async checkTenderlyStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error("Network response was not ok");
      const healthData = await response.json();
      return healthData?.checks?.tenderlyConfig || { ok: false, detail: 'Health endpoint format error' };
    } catch (error) {
      console.error('Failed to check Tenderly status:', error);
      return { ok: false, detail: 'Cannot reach backend health service' };
    }
  }

  // --- Simulate transaction via Tenderly ---
  async practiceLap(transaction) {
    if (!this.signer) await this.init();

    const fromAddress = await this.signer.getAddress();
    const token = this._getToken();
    if (!token) throw new Error("Not authenticated");

    try {
      const txToSimulate = {
        to: transaction.to,
        data: transaction.data,
        value: ethers.BigNumber.from(transaction.value.toString()),
        from: fromAddress
      };

      const response = await fetch(`${API_BASE_URL}/web3/simulate-tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(txToSimulate)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Simulation failed: ${text}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Practice lap failed: ${result.error || result.message}`);
      }

      return result;

    } catch (error) {
      console.error('Practice lap failed:', error);
      throw error;
    }
  }

  // --- Send signed transaction to backend Flashbots relay ---
  async expressLane(transaction, simulationResult) {
    if (!this.signer) await this.init();
    const token = this._getToken();
    if (!token) throw new Error("Not authenticated");

    try {
      const realTx = {
        ...transaction,
        value: ethers.BigNumber.from(transaction.value.toString()),
      };

      if (simulationResult && simulationResult.gasUsed) {
        realTx.gasLimit = ethers.BigNumber.from(simulationResult.gasUsed).mul(120).div(100);
      } else {
        const gasEstimate = await this.provider.estimateGas(realTx);
        realTx.gasLimit = gasEstimate.mul(120).div(100);
      }

      const feeData = await this.provider.getFeeData();
      if (feeData.maxFeePerGas) realTx.maxFeePerGas = feeData.maxFeePerGas;
      if (feeData.maxPriorityFeePerGas) realTx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

      realTx.chainId = 11155111;
      realTx.nonce = await this.provider.getTransactionCount(await this.signer.getAddress(), 'latest');

      const signedTx = await this.signer.signTransaction(realTx);

      const response = await fetch(`${API_BASE_URL}/web3/express-lane`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ signedTx })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Express lane failed: ${text}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Express lane failed:', error);
      throw error;
    }
  }

  // --- Secure Ticket Purchase Flow ---
  async purchaseTicketSecure(ticketData, onStatusUpdate) {
    if (!this.signer) await this.init();

    if (onStatusUpdate) onStatusUpdate('Running Tenderly simulation...');
    const simulation = await this.practiceLap({
      to: ticketData.to,
      data: ticketData.data,
      value: ticketData.value,
      from: await this.signer.getAddress()
    });

    if (!simulation.success) {
      throw new Error(`Simulation failed: ${simulation.error || simulation.message}`);
    }

    if (onStatusUpdate) onStatusUpdate('✅ Simulation successful! Awaiting signature...');
    console.log('Awaiting user signature for the real transaction...');

    const realTx = {
      from: await this.signer.getAddress(),
      to: ticketData.to,
      data: ticketData.data,
      value: ticketData.value,
    };

    if (onStatusUpdate) onStatusUpdate('Sending to Express Lane private relay...');
    const result = await this.expressLane(realTx, simulation);

    console.log('✅ Purchase complete:', result);
    return { ...result, simulation };
  }

  // --- Network Switching (Ethers v5 compatible) ---
  async switchToSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        return await this.addSepoliaNetwork();
      }
      console.error('Failed to switch network:', error);
      throw error;
    }
  }

  async addSepoliaNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
          nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 }
        }]
      });
      return true;
    } catch (addError) {
      console.error("Failed to add Sepolia network:", addError);
      throw addError;
    }
  }
}

// --- Export Singleton Instance ---
const web3ServiceInstance = new Web3Service();
export default web3ServiceInstance;
