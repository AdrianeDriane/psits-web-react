import { useState, useEffect, useRef, useCallback } from "react";
import {
  RaffleBackground,
  RaffleSlotMachine,
  RaffleControls,
  WinnersModal,
  WinnerDeclaredModal,
} from "./components";

const MOCK_PARTICIPANTS = [
  "Jan Lorenz Laroco", "Maria Santos", "Jose Reyes", "Ana Cruz", "Pedro Bautista",
  "Lucia Gonzales", "Ramon Flores", "Carmen Villanueva", "Eduardo Mendoza", "Sofia Ramos",
  "Miguel Torres", "Isabella Castro", "Andres Morales", "Valentina Jimenez", "Carlos Herrera",
  "Gabriela Romero", "Luis Vargas", "Daniela Gutierrez", "Fernando Ortiz", "Natalia Ruiz",
  "Roberto Silva", "Camila Fernandez", "Jorge Medina", "Alejandra Rios", "Mateo Paredes",
  "Valeria Aguilar", "Sebastian Perez", "Mariana Lopez", "Nicolas Martinez", "Paula Garcia",
];

const ITEM_HEIGHT = 96;
const VISIBLE = 5;
const WINNER_IDX = 80;
const SPIN_DURATION = 5000;

type Winner = { name: string; round: number; timestamp: string };

// A more performant partial Fisher-Yates shuffle to pick exactly `count` items from the pool
// This guarantees true randomness and is safely O(K) where K is the number of items you need.
function getUniqueRandomItems(pool: string[], count: number): string[] {
  const result: string[] = [];
  const poolCopy = [...pool]; // Shallow copy to avoid mutating original pool
  const max = Math.min(count, poolCopy.length);

  for (let i = 0; i < max; i++) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length);
    result.push(poolCopy[randomIndex]);
    // Swap chosen element with the last element and pop to remove efficiently O(1)
    poolCopy[randomIndex] = poolCopy[poolCopy.length - 1];
    poolCopy.pop();
  }
  return result;
}

function generateReelChunk(pool: string[], length: number): string[] {
  if (pool.length === 0) return Array(length).fill("No Participants");

  const reel: string[] = [];
  while (reel.length < length) {
    const needed = length - reel.length;
    const batch = getUniqueRandomItems(pool, needed);

    // Ensure no contiguous duplicate on the boundary between batches
    if (reel.length > 0 && batch[0] === reel[reel.length - 1] && batch.length > 1) {
      const temp = batch[0];
      batch[0] = batch[1];
      batch[1] = temp;
    }

    reel.push(...batch);
  }
  return reel;
}

function buildReel(pool: string[], winner: string): string[] {
  const reel = generateReelChunk(pool, 120);
  reel[WINNER_IDX] = winner;
  return reel;
}

function easeOut(t: number) {
  // Use a higher power (5 instead of 4) to make the spin stay fast longer and stop more aggressively
  return 1 - Math.pow(1 - t, 5);
}

export default function RaffleDraw({ eventName, eventDate }: { eventName?: string; eventDate?: string }) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [round, setRound] = useState(1);
  const [reelItems, setReelItems] = useState<string[]>(() => {
    return generateReelChunk(MOCK_PARTICIPANTS, VISIBLE + 2);
  });
  const [reelOffset, setReelOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winnerLit, setWinnerLit] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const targetOffRef = useRef(0);

  const pool = MOCK_PARTICIPANTS.filter(p => !winners.find(w => w.name === p));

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) await containerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const drawWinner = useCallback(() => {
    if (isSpinning || pool.length === 0) return;
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const reel = buildReel(pool, winner);

    setReelItems(reel);
    setWinnerLit(false);
    setIsSpinning(true);
    setIsAnimating(true);
    setShowConfetti(false);

    const center = Math.floor(VISIBLE / 2);
    const finalOff = -((WINNER_IDX - center) * ITEM_HEIGHT);
    targetOffRef.current = finalOff;
    startTimeRef.current = performance.now();
    setReelOffset(0);

    const tick = (now: number) => {
      const t = Math.min((now - startTimeRef.current) / SPIN_DURATION, 1);
      const off = (finalOff - 0) * easeOut(t);
      setReelOffset(off);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setReelOffset(finalOff);
        setIsAnimating(false);
        setIsSpinning(false);
        setWinnerLit(true);
        setShowConfetti(true);
        setPendingWinner(winner);
        setTimeout(() => setShowConfetti(false), 4500);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isSpinning, pool, round]);

  const handleConfirmWinner = () => {
    if (!pendingWinner) return;
    setWinners(prev => [...prev, { name: pendingWinner, round, timestamp: new Date().toLocaleTimeString() }]);
    setRound(r => r + 1);
    setPendingWinner(null);
    setWinnerLit(false);
  };

  const handleRedraw = () => {
    setPendingWinner(null);
    setWinnerLit(false);
    setShowConfetti(false);
    // Small delay so state settles before next spin
    setTimeout(() => drawWinner(), 100);
  };

  const handleCloseModal = () => {
    setPendingWinner(null);
    setWinnerLit(false);
    setShowConfetti(false);
  };

  const resetAll = () => {
    if (isSpinning) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setWinners([]);
    setRound(1);
    setWinnerLit(false);
    setReelOffset(0);
    setPendingWinner(null);
    setReelItems(() => {
      return generateReelChunk(MOCK_PARTICIPANTS, VISIBLE + 2);
    });
    setShowConfetti(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: "#f0f4ff", fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <RaffleBackground showConfetti={showConfetti} />

      {/* Toolbar */}
      <div className="absolute top-5 right-5 flex gap-2 z-30">
        <button onClick={toggleFullscreen} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
          background: "#ffffff", border: "1px solid #e2e8f0",
          color: "#64748b", cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15v4.5M9 15H4.5M15 15h4.5M15 15v4.5" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
            }
          </svg>
          Fullscreen
        </button>
        <button onClick={() => setShowWinners(true)} style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
          background: "#2563eb", border: "1px solid #1d4ed8",
          color: "#ffffff", cursor: "pointer",
          boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
        }}>
          ★ Winners
          {winners.length > 0 && (
            <span style={{
              background: "#ffffff", color: "#2563eb", fontSize: "11px", fontWeight: 800,
              borderRadius: "50%", width: "18px", height: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{winners.length}</span>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full" style={{ gap: "28px", maxWidth: "800px", padding: "0 20px", marginTop: "2rem" }}>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: "clamp(0.75rem, 2vw, 1.1rem)", letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#94a3b8", marginBottom: "12px", fontWeight: 700,
          }}>Raffle Draw</p>
          <h1 style={{
            fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 900,
            color: "#1e293b", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 12px",
            textShadow: "0 4px 10px rgba(0,0,0,0.05)",
            padding: "0 20px"
          }}>
            {eventName || "ICT CONGRESS 2026"}
          </h1>
          {eventDate && (
            <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.25rem)", color: "#94a3b8", margin: 0, fontWeight: 500 }}>
              {eventDate}
            </p>
          )}
        </div>

        <RaffleSlotMachine
          reelItems={reelItems}
          reelOffset={reelOffset}
          isAnimating={isAnimating}
          winnerLit={winnerLit}
        />

        {/* Remaining count */}
        <p style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.05em", margin: 0 }}>
          {pool.length} of {MOCK_PARTICIPANTS.length} participants remaining
        </p>

        <RaffleControls
          isSpinning={isSpinning}
          poolLength={pool.length}
          winnersCount={winners.length}
          onDraw={drawWinner}
          onReset={resetAll}
        />
      </div>

      {/* Winners Modal */}
      {showWinners && (
        <WinnersModal
          winners={winners}
          onClose={() => setShowWinners(false)}
        />
      )}

      {/* Winner Declared Modal */}
      {pendingWinner && (
        <WinnerDeclaredModal
          winner={pendingWinner}
          round={round}
          onConfirm={handleConfirmWinner}
          onRedraw={handleRedraw}
          onClose={handleCloseModal}
        />
      )}

      <style>{`
        @keyframes cfall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(115vh) rotate(600deg); opacity: 0; }
        }
        @keyframes drawPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
        @keyframes ringPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
