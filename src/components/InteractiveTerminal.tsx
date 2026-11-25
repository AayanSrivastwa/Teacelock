import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheckIcon, ArrowRightIcon, CpuIcon } from "./Icons";

export default function InteractiveTerminal() {
  const [inputCode, setInputCode] = useState("");
  const navigate = useNavigate();

  const sampleCodes = [
    { code: "TL-AIRMAX-092", label: "Nike Air Max 95", status: "VERIFIED" },
    { code: "TL-CHRONO-401", label: "Rolex Submariner", status: "ON-CHAIN" },
    { code: "TL-MEDVAX-882", label: "BioTech Batch A4", status: "SEALED" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/verify?code=${encodeURIComponent(inputCode.trim())}`);
    }
  };

  const handleQuickPick = (code: string) => {
    setInputCode(code);
    navigate(`/verify?code=${encodeURIComponent(code)}`);
  };

  return (
    <div className="hero-terminal-card">
      <div className="terminal-header">
        <div className="terminal-controls">
          <span className="control-dot red"></span>
          <span className="control-dot amber"></span>
          <span className="control-dot green"></span>
        </div>
        <div className="terminal-title">
          <CpuIcon size={14} color="#00e676" />
          <span>teacelock-ledger-node --mainnet --sha256</span>
        </div>
        <div className="terminal-badge">LIVE CONSENSUS</div>
      </div>

      <div className="terminal-body">
        <div className="terminal-prompt-row">
          <span className="prompt-symbol">$</span>
          <span className="prompt-cmd">verify-hash --target</span>
          <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex" }}>
            <input
              type="text"
              className="terminal-input"
              placeholder="Paste SHA-256 hash or Serial Code..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />
          </form>
          <button onClick={handleSubmit} className="terminal-run-btn">
            <span>Audit</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        <div className="terminal-quick-tags">
          <span className="tags-label">Quick Test Checkpoints:</span>
          {sampleCodes.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleQuickPick(item.code)}
              className="terminal-tag"
            >
              <ShieldCheckIcon size={12} color="#00e676" />
              <span>{item.code}</span>
              <span className="tag-status">({item.status})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

