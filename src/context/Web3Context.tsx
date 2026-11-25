import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { blockchainService } from "../lib/blockchain";
import { SUPPORTED_CHAINS, type ChainConfig } from "../lib/blockchainConfig";

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainConfig: ChainConfig;
  contractAddress: string;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: () => Promise<void>;
  setContractAddress: (addr: string) => void;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  chainConfig: SUPPORTED_CHAINS.polygonAmoy,
  contractAddress: "",
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchChain: async () => {},
  setContractAddress: () => {},
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddrState] = useState<string>(() =>
    blockchainService.getContractAddress()
  );

  const chainConfig = SUPPORTED_CHAINS.polygonAmoy;

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });

      window.ethereum.on?.("chainChanged", (hexId: string) => {
        setChainId(parseInt(hexId, 16));
      });
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { address, chainId } = await blockchainService.getBrowserSigner();
      setAccount(address);
      setChainId(chainId);
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err?.message || "Failed to connect Web3 wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
  };

  const switchChain = async () => {
    try {
      await blockchainService.switchNetwork(chainConfig);
    } catch (err: any) {
      setError(err?.message || "Failed to switch chain");
    }
  };

  const setContractAddress = (addr: string) => {
    blockchainService.setContractAddress(addr);
    setContractAddrState(addr);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnected: Boolean(account),
        isConnecting,
        chainConfig,
        contractAddress,
        error,
        connectWallet,
        disconnectWallet,
        switchChain,
        setContractAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
