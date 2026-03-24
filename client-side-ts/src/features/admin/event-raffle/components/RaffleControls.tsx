import React from "react";

interface RaffleControlsProps {
  isSpinning: boolean;
  poolLength: number;
  winnersCount: number;
  onDraw: () => void;
  onReset: () => void;
}

export const RaffleControls: React.FC<RaffleControlsProps> = ({
  isSpinning,
  poolLength,
  winnersCount,
  onDraw,
  onReset,
}) => {
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
      <button
        onClick={onDraw}
        disabled={isSpinning || poolLength === 0}
        className="btn btn-primary"
        aria-disabled={isSpinning || poolLength === 0}
      >
        {isSpinning ? "Spinning…" : "Draw Winner"}
      </button>

      {winnersCount > 0 && !isSpinning && (
        <button onClick={onReset} className="btn btn-secondary">
          Reset
        </button>
      )}
    </div>
  );
};
