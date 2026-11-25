import { useWeb3 } from "../context/Web3Context";
import { WalletIcon } from "./Icons";

export default function WalletButton() {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWeb3();

  if (isConnected && account) {
    const truncated = `${account.slice(0, 6)}...${account.slice(-4)}`;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={disconnectWallet}
          className="btn-secondary"
          style={{
            padding: "6px 12px",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            borderColor: "rgba(0, 230, 118, 0.4)",
            color: "var(--neon-green)",
            background: "rgba(0, 230, 118, 0.08)",
          }}
          title="Click to disconnect wallet"
        >
          <span className="brand-dot" style={{ width: "7px", height: "7px" }}></span>
          <span>{truncated}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="btn-secondary"
      style={{
        padding: "6px 14px",
        fontSize: "0.82rem",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
      title="Connect Web3 Wallet (MetaMask, Coinbase, Brave)"
    >
      <WalletIcon size={15} color="var(--neon-green)" />
      <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
    </button>
  );
}
