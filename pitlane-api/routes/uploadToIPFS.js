import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

export const uploadJSONToIPFS = async (metadata) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  try {
    const response = await axios.post(url, metadata, {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    const cid = response.data.IpfsHash;
    return `https://ipfs.io/ipfs/${cid}`;
  } catch (error) {
    console.error("Error uploading JSON:", error.response?.data || error.message);
    return null;
  }
};
