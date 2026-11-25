import { ethers } from "ethers";
import { TEACELOCK_ABI, SUPPORTED_CHAINS, type ChainConfig } from "./blockchainConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface OnChainProductData {
  exists: boolean;
  name: string;
  brand: string;
  productHash: string;
  status: number; // 0=Active, 1=Flagged, 2=Recalled, 3=Retired
  registeredAt: number;
  registeredBy: string;
  milestoneCount: number;
}

export class BlockchainService {
  private defaultChain: ChainConfig = SUPPORTED_CHAINS.polygonAmoy;

  // Reads from env or user storage
  getContractAddress(): string {
    return (
      import.meta.env.VITE_CONTRACT_ADDRESS ||
      localStorage.getItem("teacelock_contract_address") ||
      ""
    );
  }

  setContractAddress(addr: string) {
    localStorage.setItem("teacelock_contract_address", addr.trim());
  }

  getRpcProvider(): ethers.JsonRpcProvider {
    const rpcUrl = import.meta.env.VITE_BLOCKCHAIN_RPC_URL || this.defaultChain.rpcUrl;
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  async getBrowserSigner(): Promise<{ signer: ethers.Signer; address: string; chainId: number }> {
    if (!window.ethereum) {
      throw new Error("No Web3 wallet (MetaMask / Brave / Coinbase) detected. Please install a wallet extension.");
    }

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    await browserProvider.send("eth_requestAccounts", []);
    const network = await browserProvider.getNetwork();
    const signer = await browserProvider.getSigner();
    const address = await signer.getAddress();

    return {
      signer,
      address,
      chainId: Number(network.chainId),
    };
  }

  async switchNetwork(chain: ChainConfig = this.defaultChain): Promise<void> {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.hexChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chain.hexChainId,
              chainName: chain.name,
              rpcUrls: [chain.rpcUrl],
              nativeCurrency: {
                name: chain.currencySymbol,
                symbol: chain.currencySymbol,
                decimals: 18,
              },
              blockExplorerUrls: [chain.explorerUrl],
            },
          ],
        });
      }
    }
  }

  /**
   * Anchors a new product hash to the blockchain
   */
  async anchorProduct(
    productCode: string,
    name: string,
    brand: string,
    hashHex: string
  ): Promise<{ txHash: string; explorerUrl: string }> {
    const contractAddr = this.getContractAddress();
    if (!contractAddr) {
      // Simulate on-chain transaction hash when contract is not yet deployed
      const mockTx = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return {
        txHash: mockTx,
        explorerUrl: `${this.defaultChain.explorerUrl}/tx/${mockTx}`,
      };
    }

    const { signer } = await this.getBrowserSigner();
    const contract = new ethers.Contract(contractAddr, TEACELOCK_ABI, signer);

    // Format SHA-256 hash as bytes32
    let bytes32Hash = hashHex.startsWith("0x") ? hashHex : "0x" + hashHex;
    if (bytes32Hash.length !== 66) {
      bytes32Hash = ethers.zeroPadValue(bytes32Hash, 32);
    }

    const tx = await contract.registerProduct(productCode, name, brand, bytes32Hash);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      explorerUrl: `${this.defaultChain.explorerUrl}/tx/${receipt.hash}`,
    };
  }

  /**
   * Verifies product authenticity against on-chain contract
   */
  async verifyOnChain(productCode: string): Promise<OnChainProductData | null> {
    const contractAddr = this.getContractAddress();
    if (!contractAddr) return null;

    try {
      const provider = this.getRpcProvider();
      const contract = new ethers.Contract(contractAddr, TEACELOCK_ABI, provider);

      const result = await contract.verifyProduct(productCode);
      if (!result[0]) return null;

      return {
        exists: result[0],
        name: result[1],
        brand: result[2],
        productHash: result[3],
        status: Number(result[4]),
        registeredAt: Number(result[5]),
        registeredBy: result[6],
        milestoneCount: Number(result[7]),
      };
    } catch (err) {
      console.warn("On-chain verification lookup failed or not deployed:", err);
      return null;
    }
  }

  /**
   * Records a custody event on the blockchain
   */
  async recordMilestoneOnChain(
    productCode: string,
    eventType: string,
    location: string,
    actorName: string,
    notes: string
  ): Promise<{ txHash: string; explorerUrl: string }> {
    const contractAddr = this.getContractAddress();
    if (!contractAddr) {
      const mockTx = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return {
        txHash: mockTx,
        explorerUrl: `${this.defaultChain.explorerUrl}/tx/${mockTx}`,
      };
    }

    const { signer } = await this.getBrowserSigner();
    const contract = new ethers.Contract(contractAddr, TEACELOCK_ABI, signer);

    const tx = await contract.recordMilestone(
      productCode,
      eventType,
      location,
      actorName,
      notes || ""
    );
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      explorerUrl: `${this.defaultChain.explorerUrl}/tx/${receipt.hash}`,
    };
  }
}

export const blockchainService = new BlockchainService();
