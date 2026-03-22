const { ethers } = require("ethers");

const PROVIDER_RPC_URL = process.env.ETH_RPC_URL || "http://127.0.0.1:8545";
const SYSTEM_WALLET_PRIVATE_KEY = process.env.ETH_REFUND_PRIVATE_KEY || "";
const SYSTEM_WALLET_ADDRESS = process.env.ETH_REFUND_ADDRESS || "";

const provider = new ethers.JsonRpcProvider(PROVIDER_RPC_URL);

function weiFromEth(eth) {
  return ethers.parseEther(String(eth));
}

function ethFromWei(wei) {
  return Number(ethers.formatEther(wei));
}

async function sendRefundToWallet(toAddress, ethAmount) {
  if (!SYSTEM_WALLET_PRIVATE_KEY || !SYSTEM_WALLET_ADDRESS) {
    console.warn("[ethRefund] 未配置 ETH_REFUND_PRIVATE_KEY 或 ETH_REFUND_ADDRESS，跳过链上退款");
    return { txHash: null, skipped: true };
  }
  if (!toAddress || !ethAmount || ethAmount <= 0) {
    return { txHash: null, skipped: true, reason: "invalid params" };
  }
  try {
    const wallet = new ethers.Wallet(SYSTEM_WALLET_PRIVATE_KEY, provider);
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: weiFromEth(ethAmount)
    });
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to,
      valueEth: ethAmount
    };
  } catch (err) {
    console.error("[ethRefund] ETH 转账失败:", err.message);
    return { txHash: null, error: err.message };
  }
}

module.exports = { sendRefundToWallet, weiFromEth, ethFromWei };
