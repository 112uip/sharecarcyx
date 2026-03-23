import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./src",
    artifacts: "./artifacts",
  },
  networks: {
    localhost: {
      url: process.env.ETH_RPC_URL || "http://127.0.0.1:8545",
    },
  },
};
