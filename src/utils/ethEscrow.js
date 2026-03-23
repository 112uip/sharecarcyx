const { ethers } = require("ethers");

const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || "";
const ESCROW_ABI = [
  // 读取函数
  'function getOrderState(bytes32 _orderId) external view returns (uint8 state, uint256 amount, uint256 createdAt)',
  'function platformWallet() external view returns (address)',
  'function getContractBalance() external view returns (uint256)',
  // 写入函数
  'function refundEscrow(bytes32 _orderId, string calldata _reason) external',
  'function cancelEscrow(bytes32 _orderId, string calldata _reason) external',
  // 事件
  'event EscrowRefunded(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp)',
  'event EscrowCancelled(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp)',
  'event EscrowCompleted(bytes32 indexed orderId, uint256 amount, uint256 timestamp)',
];

let _provider = null;
let _contract = null;

function getProvider() {
  if (!_provider) {
    const rpcUrl = process.env.ETH_RPC_URL || "http://127.0.0.1:8545";
    _provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return _provider;
}

function getContract() {
  if (!ESCROW_CONTRACT_ADDRESS) return null;
  if (!_contract) {
    _contract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, getProvider());
  }
  return _contract;
}

function orderIdToBytes32(orderId) {
  return ethers.keccak256(ethers.toUtf8Bytes(orderId));
}

async function getEscrowState(orderId) {
  const contract = getContract();
  if (!contract) return null;
  try {
    const raw = await contract.getOrderState(orderIdToBytes32(orderId));
    return {
      state: Number(raw[0]),
      amount: Number(ethers.formatEther(raw[1])),
      createdAt: Number(raw[2]),
    };
  } catch {
    return null;
  }
}

async function refundViaContract(orderId, reason) {
  const contract = getContract();
  if (!contract) return null;

  const privateKey = process.env.ETH_REFUND_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("[ethEscrow] 未配置 ETH_REFUND_PRIVATE_KEY，无法通过合约退费");
    return null;
  }

  const wallet = new ethers.Wallet(privateKey, getProvider());
  const contractWithSigner = contract.connect(wallet);

  try {
    const tx = await contractWithSigner.refundEscrow(orderIdToBytes32(orderId), reason);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("[ethEscrow] 合约退费失败:", err.message);
    return null;
  }
}

async function cancelViaContract(orderId, reason) {
  const contract = getContract();
  if (!contract) return null;

  const privateKey = process.env.ETH_REFUND_PRIVATE_KEY;
  if (!privateKey) return null;

  const wallet = new ethers.Wallet(privateKey, getProvider());
  const contractWithSigner = contract.connect(wallet);

  try {
    const tx = await contractWithSigner.cancelEscrow(orderIdToBytes32(orderId), reason);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("[ethEscrow] 合约取消失败:", err.message);
    return null;
  }
}

module.exports = {
  getContract,
  getEscrowState,
  refundViaContract,
  cancelViaContract,
  orderIdToBytes32,
};
