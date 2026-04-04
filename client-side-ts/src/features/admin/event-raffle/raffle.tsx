import {
  drawRaffleWinner,
  getEligibleRaffleAttendeesV2,
  resetRaffleWinners,
  undoRaffleWinner,
} from "@/features/events/api/eventService";
import type {
  DrawRaffleWinnerResponse,
  RaffleAttendeeDto,
} from "@/features/events/types/event.types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  RaffleBackground,
  RaffleControls,
  RaffleSlotMachine,
  WinnerDeclaredModal,
  WinnersModal,
} from "./components";

const ITEM_HEIGHT = 96;
const VISIBLE = 5;
const WINNER_IDX = 80;
// const SPIN_DURATION = 6000;

const FREE_SPIN_SPEED = 0.12;
const FINALE_DURATION = 2800;
const FREE_SPIN_LOOP_SIZE = ITEM_HEIGHT * 30;

type Winner = { name: string; round: number; timestamp: string };

type PendingWinner = DrawRaffleWinnerResponse["winner"] | null;

function getUniqueRandomItems(pool: string[], count: number): string[] {
  const result: string[] = [];
  const poolCopy = [...pool];
  const max = Math.min(count, poolCopy.length);

  for (let i = 0; i < max; i++) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length);
    result.push(poolCopy[randomIndex]);
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

    if (
      reel.length > 0 &&
      batch[0] === reel[reel.length - 1] &&
      batch.length > 1
    ) {
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
  return 1 - Math.pow(1 - t, 5);
}

export default function RaffleDraw({
  eventName,
  eventDate,
}: {
  eventName?: string;
  eventDate?: string;
}) {
  const { eventId } = useParams<{ eventId: string }>();
  const normalizedEventId = eventId?.trim() ?? "";
  const [allParticipants, setAllParticipants] = useState<RaffleAttendeeDto[]>(
    []
  );
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [round, setRound] = useState(1);
  const [reelItems, setReelItems] = useState<string[]>(() => {
    return generateReelChunk([], VISIBLE + 2);
  });
  const [isRedrawing, setIsRedrawing] = useState(false);
  const [reelOffset, setReelOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winnerLit, setWinnerLit] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<PendingWinner>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>(
    undefined
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const targetOffRef = useRef(0);
  const fetchedWinnerRef = useRef<PendingWinner>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPool = async () => {
      if (!normalizedEventId) {
        setIsLoadingParticipants(false);
        return;
      }

      setIsLoadingParticipants(true);
      setLoadError(null);

      try {
        const pool = await getEligibleRaffleAttendeesV2(normalizedEventId, {
          campus: selectedCampus,
        });
        if (cancelled) return;
        setAllParticipants(pool.eligible);

        if (pool.winners && pool.winners.length > 0) {
          const historicalWinners = pool.winners.map((w, index) => ({
            name: w.name,
            round: index + 1,
            timestamp: "Previously Drawn",
          }));
          setWinners(historicalWinners);
          setRound(historicalWinners.length + 1);
        }
        setTotalParticipants(
          (pool.eligible?.length ?? 0) + (pool.winners?.length ?? 0)
        );
        const names = pool.eligible.map((a) => a.name).filter(Boolean);
        setReelItems(generateReelChunk(names, VISIBLE + 2));
      } catch {
        if (!cancelled) {
          setLoadError("Failed to load raffle pool.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingParticipants(false);
        }
      }
    };

    void loadPool();

    return () => {
      cancelled = true;
    };
  }, [normalizedEventId, selectedCampus]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement)
      await containerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Decoupled Draw function (Instant UI reaction + background API)
  const drawWinner = useCallback(() => {
    if (isSpinning || allParticipants.length === 0) return;

    setIsSpinning(true);
    setWinnerLit(false);
    setShowConfetti(false);
    fetchedWinnerRef.current = null;

    // --- PHASE 1: THE INFINITE TREADMILL ---
    const participantNames = allParticipants.map((a) => a.name).filter(Boolean);
    setReelItems(generateReelChunk(participantNames, 150)); // Generate a massive chunk
    setIsAnimating(true);

    let isFetching = true;
    let treadmillStartTime = performance.now();
    const FAST_SPIN_SPEED = 3.5; // Fast enough to blur, slow enough not to strobe

    const infiniteTick = (now: number) => {
      let elapsed = now - treadmillStartTime;
      let off = -(elapsed * FAST_SPIN_SPEED);

      // Seamless Loop: If we scroll past 50 items, silently snap the clock back to 0.
      // Because it's spinning so fast, the human eye cannot see the reset!
      if (off <= -(ITEM_HEIGHT * 50)) {
        treadmillStartTime = now;
        off = 0;
      }

      setReelOffset(off);

      if (isFetching) {
        rafRef.current = requestAnimationFrame(infiniteTick);
      }
    };

    // Start the infinite spin instantly
    rafRef.current = requestAnimationFrame(infiniteTick);

    // --- PHASE 2: THE API CALL & BRAKES ---
    drawRaffleWinner(normalizedEventId)
      .then((response) => {
        fetchedWinnerRef.current = response.winner;

        // 1. Turn off the treadmill
        isFetching = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        // 2. Rebuild the final reel with the winner exactly at WINNER_IDX
        setReelItems(buildReel(participantNames, response.winner.name));

        // 3. Set up the Brake math
        const center = Math.floor(VISIBLE / 2);
        const finalOff = -((WINNER_IDX - center) * ITEM_HEIGHT);
        const brakeStartTime = performance.now();

        // We snap the offset to 0 so the easeOut curve has a full runway to stop smoothly
        // setReelOffset(0);

        const brakingTick = (now: number) => {
          const t = Math.min((now - brakeStartTime) / FINALE_DURATION, 1);
          const off = finalOff * easeOut(t);
          setReelOffset(off);

          if (t < 1) {
            rafRef.current = requestAnimationFrame(brakingTick);
          } else {
            // Animation finished!
            setReelOffset(finalOff);
            setIsAnimating(false);
            setIsSpinning(false);
            setWinnerLit(true);

            if (fetchedWinnerRef.current) {
              setShowConfetti(true);
              setPendingWinner(fetchedWinnerRef.current);
              setTimeout(() => setShowConfetti(false), 4500);
            }
          }
        };

        // Start braking
        rafRef.current = requestAnimationFrame(brakingTick);
      })
      .catch((error) => {
        console.error("Failed to draw from server:", error);
        isFetching = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        // Land on an error slot if the network totally fails
        setReelItems((prev) => {
          const updated = [...prev];
          updated[WINNER_IDX] = "Draw Error";
          return updated;
        });

        setIsAnimating(false);
        setIsSpinning(false);
        alert("Network Error: Could not draw winner. Please try again.");
      });
  }, [isSpinning, normalizedEventId, allParticipants]);

  const handleConfirmWinner = () => {
    if (!pendingWinner) return;
    setWinners((prev) => [
      ...prev,
      {
        name: pendingWinner.name,
        round,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setAllParticipants((prev) =>
      prev.filter((a) => a.attendeeId !== pendingWinner.attendeeId)
    );
    setRound((r) => r + 1);
    setPendingWinner(null);
    setWinnerLit(false);
  };

  const handleRedraw = async () => {
    if (!pendingWinner || isRedrawing) return;

    setIsSpinning(true);
    setIsRedrawing(true);
    try {
      await undoRaffleWinner(normalizedEventId, pendingWinner.attendeeId);

      setPendingWinner(null);
      setWinnerLit(false);
      setShowConfetti(false);
      setPendingWinner(null);

      setTimeout(() => {
        setIsRedrawing(false); // unlock only after redraw starts
        drawWinner();
      }, 100);
    } catch (error) {
      console.error("Undo failed:", error);
      alert("Failed to undo winner. Please try again.");
      setIsSpinning(false);
      setIsRedrawing(false);
    }
  };

  const handleCloseModal = () => {
    setPendingWinner(null);
    setWinnerLit(false);
    setShowConfetti(false);
  };

  const resetAll = async () => {
    if (isSpinning) return;

    const confirmReset = window.confirm(
      "Are you sure you want to reset the entire raffle? All previous winners will be deleted and put back into the pool."
    );
    if (!confirmReset) return;

    setIsSpinning(true);

    try {
      await resetRaffleWinners(normalizedEventId);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setWinners([]);
      setRound(1);
      setWinnerLit(false);
      setReelOffset(0);
      setPendingWinner(null);
      setShowConfetti(false);
      const pool = await getEligibleRaffleAttendeesV2(normalizedEventId, {
        campus: selectedCampus,
      });

      setAllParticipants(pool.eligible);
      setTotalParticipants(pool.totalEligible);

      const participantNames = pool.eligible.map((a) => a.name).filter(Boolean);
      setReelItems(() => generateReelChunk(participantNames, VISIBLE + 2));
    } catch (error) {
      console.error("Failed to reset raffle:", error);
      alert("Failed to reset the raffle. Please try again.");
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: "#f0f4ff",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <RaffleBackground showConfetti={showConfetti} />

      {/* Toolbar */}
      <div className="absolute top-5 right-5 z-30 flex gap-2">
        <button
          onClick={toggleFullscreen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 500,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#64748b",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <svg
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isFullscreen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15v4.5M9 15H4.5M15 15h4.5M15 15v4.5"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
              />
            )}
          </svg>
          Fullscreen
        </button>
        <button
          onClick={() => setShowWinners(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            background: "#2563eb",
            border: "1px solid #1d4ed8",
            color: "#ffffff",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}
        >
          ★ Winners
          {winners.length > 0 && (
            <span
              style={{
                background: "#ffffff",
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: 800,
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {winners.length}
            </span>
          )}
        </button>
      </div>

      {/* Main content */}
      <div
        className="relative z-10 flex w-full flex-col items-center"
        style={{
          gap: "28px",
          maxWidth: "800px",
          padding: "0 20px",
          marginTop: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "clamp(0.75rem, 2vw, 1.1rem)",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: "12px",
              fontWeight: 700,
            }}
          >
            Raffle Draw
          </p>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              fontWeight: 900,
              color: "#1e293b",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
              textShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding: "0 20px",
            }}
          >
            {eventName || "ICT CONGRESS 2026"}
          </h1>
          {eventDate && (
            <p
              style={{
                fontSize: "clamp(0.85rem, 2.5vw, 1.25rem)",
                color: "#94a3b8",
                margin: 0,
                fontWeight: 500,
              }}
            >
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

        <p
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          {allParticipants.length} of {totalParticipants} participants remaining
        </p>

        <RaffleControls
          isSpinning={isSpinning || isLoadingParticipants}
          poolLength={allParticipants.length}
          winnersCount={winners.length}
          onDraw={drawWinner}
          onReset={() => {}}
          disableReset={true}
        />
      </div>
      {showWinners && (
        <WinnersModal winners={winners} onClose={() => setShowWinners(false)} />
      )}
      {pendingWinner && (
        <WinnerDeclaredModal
          winner={pendingWinner.name}
          round={round}
          onConfirm={handleConfirmWinner}
          onRedraw={handleRedraw}
          onClose={handleCloseModal}
          isRedrawing={isRedrawing}
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
