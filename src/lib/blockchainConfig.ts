export const TEACELOCK_ABI = [
  "function owner() view returns (address)",
  "function registerProduct(string productCode, string name, string brand, bytes32 productHash) external",
  "function updateProductStatus(string productCode, uint8 newStatus) external",
  "function recordMilestone(string productCode, string eventType, string location, string actorName, string notes) external",
  "function verifyProduct(string productCode) external view returns (bool exists, string name, string brand, bytes32 productHash, uint8 status, uint256 registeredAt, address registeredBy, uint256 milestoneCount)",
  "function getMilestone(string productCode, uint256 index) external view returns (string eventType, string location, string actorName, string notes, uint256 timestamp, address recordedBy)",
  "event ProductRegistered(string indexed productCode, string name, string brand, bytes32 productHash, uint256 timestamp, address indexed registeredBy)",
  "event StatusChanged(string indexed productCode, uint8 newStatus, uint256 timestamp, address indexed updatedBy)",
  "event MilestoneRecorded(string indexed productCode, string eventType, string location, string actorName, uint256 timestamp)"
];

export interface ChainConfig {
  chainId: number;
  hexChainId: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currencySymbol: string;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  polygonAmoy: {
    chainId: 80002,
    hexChainId: "0x13882",
    name: "Polygon Amoy Testnet",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    currencySymbol: "MATIC",
  },
  sepolia: {
    chainId: 11155111,
    hexChainId: "0xaa36a7",
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    currencySymbol: "ETH",
  },
};
