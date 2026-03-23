import { ethers } from 'ethers'

// 托管合约 ABI（仅包含我们需要的函数和事件）
const ESCROW_ABI = [
  // 写入函数
  'function createEscrow(bytes32 _orderId, string calldata _orderIdRaw) external payable returns (bool success)',
  'function startUsing(bytes32 _orderId) external',
  'function completeEscrow(bytes32 _orderId, string calldata _note) external',
  'function refundEscrow(bytes32 _orderId, string calldata _reason) external',
  'function cancelEscrow(bytes32 _orderId, string calldata _reason) external',
  // 查询函数
  'function getOrderState(bytes32 _orderId) external view returns (uint8 state, uint256 amount, uint256 createdAt)',
  'function platformWallet() external view returns (address)',
  'function getContractBalance() external view returns (uint256)',
  // 事件
  'event EscrowCreated(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp)',
  'event EscrowStarted(bytes32 indexed orderId, uint256 timestamp)',
  'event EscrowCompleted(bytes32 indexed orderId, uint256 amount, uint256 timestamp)',
  'event EscrowRefunded(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp)',
  'event EscrowCancelled(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp)',
]

/**
 * 获取托管合约实例（写入版：绑定 signer）
 * @returns {Promise<ethers.Contract | null>}
 */
async function getEscrowContract() {
  const address = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS
  if (!address) return null
  if (!window.ethereum) return null

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return new ethers.Contract(address, ESCROW_ABI, signer)
}

/**
 * 获取托管合约实例（只读版：绑定 provider）
 * @returns {Promise<ethers.Contract | null>}
 */
async function getEscrowContractReadonly() {
  const address = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS
  if (!address) return null
  if (!window.ethereum) return null

  const provider = new ethers.BrowserProvider(window.ethereum)
  return new ethers.Contract(address, ESCROW_ABI, provider)
}

/**
 * ETH 金额转换为 BigInt wei
 * @param {string|number} eth
 * @returns {bigint}
 */
function ethToWei(eth) {
  return ethers.parseEther(String(eth))
}

/**
 * BigInt wei 转换为 ETH 字符串（保留 6 位小数）
 * @param {bigint} wei
 * @returns {string}
 */
function weiToEth(wei) {
  return ethers.formatEther(wei)
}

/**
 * 将订单 UUID 转换为 bytes32（Solidity 格式）
 * @param {string} orderId
 * @returns {string} 0x 开头的大写十六进制字符串
 */
function orderIdToBytes32(orderId) {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(orderId))
  return hash
}

/**
 * 查询订单的链上托管状态
 * @param {string} orderId - 后端返回的订单 UUID
 * @returns {Promise<{state: number, amount: string, createdAt: number}>}
 *   state: 0=InEscrow, 1=InUse, 2=Completed, 3=Refunded, 4=Cancelled
 */
async function queryEscrowState(orderId) {
  const contract = await getEscrowContractReadonly()
  if (!contract) return null
  try {
    const raw = await contract.getOrderState(orderIdToBytes32(orderId))
    return {
      state: Number(raw[0]),
      amount: weiToEth(raw[1]),
      createdAt: Number(raw[2]),
    }
  } catch {
    return null
  }
}

/**
 * 用户存入押金到托管合约（创建订单时调用）
 * @param {string} orderId   - 预创建的订单 UUID（后端返回）
 * @param {string} ethAmount - 押金 ETH 金额
 * @returns {Promise<{txHash: string}>}
 */
async function depositToEscrow(orderId, ethAmount) {
  const contract = await getEscrowContract()
  if (!contract) throw new Error('托管合约未配置（请在 .env 中填入 VITE_ESCROW_CONTRACT_ADDRESS）')

  const orderIdBytes32 = orderIdToBytes32(orderId)
  const wei = ethToWei(ethAmount)

  // ethers v6: 使用 BrowserProvider.sendTransaction 方式
  const tx = await contract.createEscrow(orderIdBytes32, orderId, { value: wei })
  const receipt = await tx.wait()

  return { txHash: receipt.hash }
}

/**
 * 用户取车时调用合约（InEscrow -> InUse）
 * @param {string} orderId
 * @returns {Promise<{txHash: string}>}
 */
async function startUsingEscrow(orderId) {
  const contract = await getEscrowContract()
  if (!contract) throw new Error('托管合约未配置')
  const tx = await contract.startUsing(orderIdToBytes32(orderId))
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

/**
 * 用户完成订单时调用合约，释放押金给平台（InUse -> Completed）
 * @param {string} orderId
 * @param {string} note - 备注
 * @returns {Promise<{txHash: string}>}
 */
async function completeEscrowPayment(orderId, note = 'completed') {
  const contract = await getEscrowContract()
  if (!contract) throw new Error('托管合约未配置')
  const tx = await contract.completeEscrow(orderIdToBytes32(orderId), note)
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

/**
 * 管理员处理故障退费时调用，原路退回用户（InUse -> Refunded）
 * @param {string} orderId
 * @param {string} reason - 退费原因
 * @returns {Promise<{txHash: string}>}
 */
async function refundEscrowPayment(orderId, reason) {
  const contract = await getEscrowContract()
  if (!contract) throw new Error('托管合约未配置')
  const tx = await contract.refundEscrow(orderIdToBytes32(orderId), reason)
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

export {
  getEscrowContract,
  ethToWei,
  weiToEth,
  orderIdToBytes32,
  queryEscrowState,
  depositToEscrow,
  startUsingEscrow,
  completeEscrowPayment,
  refundEscrowPayment,
  ESCROW_ABI,
}
