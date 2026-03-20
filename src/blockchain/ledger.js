const crypto = require("crypto");

class ConsortiumLedger {
  constructor(consortiumMembers, dataStore) {
    this.members = consortiumMembers;
    this.dataStore = dataStore;
    this.blocks = [];
    this.pendingTransactions = [];
  }

  async init() {
    const blocks = await this.dataStore.getBlocksWithTransactions();
    if (blocks.length === 0) {
      const genesis = this.createGenesisBlock();
      await this.dataStore.saveBlock(genesis);
      this.blocks = [genesis];
      return;
    }
    this.blocks = blocks;
  }

  createGenesisBlock() {
    return {
      index: 0,
      previousHash: "0",
      timestamp: Date.now(),
      validator: "genesis",
      reason: "genesis",
      transactions: [],
      hash: "genesis"
    };
  }

  getLatestBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  async queueTransaction(type, payload) {
    const tx = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now()
    };
    this.pendingTransactions.push(tx);
    await this.dataStore.savePendingTransaction(tx);
    return tx;
  }

  async commitBlock(validator, reason) {
    const selectedValidator = this.members.includes(validator) ? validator : this.members[0];
    const previousBlock = this.getLatestBlock();
    const blockTransactions = this.pendingTransactions.splice(0);
    const block = {
      index: this.blocks.length,
      previousHash: previousBlock.hash,
      timestamp: Date.now(),
      validator: selectedValidator,
      reason,
      transactions: blockTransactions
    };
    block.hash = this.calculateHash(block);
    this.blocks.push(block);
    await this.dataStore.saveBlock(block);
    await this.dataStore.attachTransactionsToBlock(
      blockTransactions.map((item) => item.id),
      block.index
    );
    return block;
  }

  calculateHash(block) {
    return crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          index: block.index,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          validator: block.validator,
          reason: block.reason,
          transactions: block.transactions
        })
      )
      .digest("hex");
  }
}

module.exports = ConsortiumLedger;
