import React from "react";

type Winner = { name: string; round: number; timestamp: string };

interface WinnersModalProps {
  winners: Winner[];
  onClose: () => void;
}

export const WinnersModal: React.FC<WinnersModalProps> = ({ winners, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "440px", maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          background: "#ffffff", borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
        }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
            ★ Winners List
          </span>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            color: "#fff", fontSize: "18px", lineHeight: 1,
            cursor: "pointer", borderRadius: "6px", width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px" }}>
          {winners.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "48px 0" }}>
              <p style={{ fontWeight: 600, margin: 0, color: "#64748b" }}>No winners yet</p>
              <p style={{ fontSize: "13px", marginTop: "4px" }}>Draw a winner to get started!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {winners.map((w, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "11px 14px",
                  background: "#f8faff",
                  border: "1px solid #dbeafe",
                  borderRadius: "12px",
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    background: "#dbeafe", border: "1.5px solid #93c5fd",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 800, color: "#2563eb",
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: "#1e293b", fontWeight: 700, fontSize: "0.92rem",
                      margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{w.name}</p>
                    <p style={{ color: "#94a3b8", fontSize: "11px", margin: "2px 0 0" }}>
                      Round {w.round} · {w.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#f8fafc",
        }}>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            {winners.length} winner{winners.length !== 1 ? "s" : ""} drawn
          </span>
          <button onClick={onClose} style={{
            padding: "6px 18px", borderRadius: "20px",
            background: "#2563eb", border: "none",
            color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
};
