const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CarShareEscrow with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 从环境变量读取平台收款钱包地址，若未配置则使用部署者地址
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

  const EscrowFactory = await ethers.getContractFactory("CarShareEscrow");
  const escrow = await EscrowFactory.deploy(platformWallet);

  await escrow.waitForDeployment();
  const contractAddress = await escrow.getAddress();

  console.log("=================================================");
  console.log("CarShareEscrow deployed to:", contractAddress);
  console.log("Platform wallet set to:   ", platformWallet);
  console.log("=================================================");
  console.log("\n请将以下内容填入项目 .env 文件：");
  console.log(`ESCROW_CONTRACT_ADDRESS=${contractAddress}`);

  // 验证基本功能
  const balance = await ethers.provider.getBalance(contractAddress);
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
