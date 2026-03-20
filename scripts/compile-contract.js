const fs = require("fs");
const path = require("path");
const solc = require("solc");

const contractPath = path.join(__dirname, "..", "contracts", "ConsortiumCarShare.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "ConsortiumCarShare.sol": {
      content: source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    viaIR: true,
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors) {
  const hardErrors = output.errors.filter((item) => item.severity === "error");
  output.errors.forEach((item) => {
    console.log(item.formattedMessage);
  });
  if (hardErrors.length > 0) {
    process.exit(1);
  }
}

const contractOutput = output.contracts["ConsortiumCarShare.sol"].ConsortiumCarShare;
const targetDir = path.join(__dirname, "..", "artifacts");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}

fs.writeFileSync(path.join(targetDir, "ConsortiumCarShare.abi.json"), JSON.stringify(contractOutput.abi, null, 2));
fs.writeFileSync(path.join(targetDir, "ConsortiumCarShare.bytecode.txt"), contractOutput.evm.bytecode.object);
console.log("contract compiled successfully");
