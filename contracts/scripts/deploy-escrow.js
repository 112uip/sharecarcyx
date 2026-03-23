import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );

  console.log("Deploying CarShareEscrow with account:", wallet.address);
  console.log("Account balance:", (await provider.getBalance(wallet.address)).toString());

  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || wallet.address;

  const abi = [
    "function createEscrow(address renter, address lender, uint256 amount) payable",
    "function releaseEscrow(bytes32 escrowId)",
    "function refundEscrow(bytes32 escrowId)",
    "function getEscrow(bytes32 escrowId) view returns (address, address, address, uint256, uint8, uint256)",
    "function platformWallet() view returns (address)",
  ];

  const artifactPath = path.join(__dirname, "../artifacts/src/CarShareEscrow.sol/CarShareEscrow.json");
  let bytecode, abiFromArtifact;
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    bytecode = artifact.bytecode;
    abiFromArtifact = artifact.abi;
  } else {
    console.error("\n找不到编译产物，请先运行: npx hardhat compile");
    console.log("\n当前使用占位 bytecode，仅用于验证脚本逻辑。");
    bytecode = "0x";
  }

  const finalAbi = abiFromArtifact || abi;

  const EscrowFactory = new ethers.ContractFactory(finalAbi, bytecode, wallet);
  console.log("\n部署中...");
  const escrow = await EscrowFactory.deploy(platformWallet);
  await escrow.waitForDeployment();
  const contractAddress = await escrow.getAddress();

  console.log("=================================================");
  console.log("CarShareEscrow deployed to:", contractAddress);
  console.log("Platform wallet set to:   ", platformWallet);
  console.log("=================================================");
  console.log("\n请将以下内容填入前端 .env 文件：");
  console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n请将以下内容填入后端 .env 文件：");
  console.log(`ESCROW_CONTRACT_ADDRESS=${contractAddress}`);

  const balance = await provider.getBalance(contractAddress);
  console.log("\n[Verification] Contract balance:", balance.toString());
  const state = await escrow.platformWallet();
  console.log("[Verification] Platform wallet:", state);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
