export async function mintNFT(toAddress, tokenURI) {
  try {
    const response = await fetch("http://localhost:3001/api/web3/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toAddress, tokenURI }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error minting NFT:", error);
    throw error;
  }
}
