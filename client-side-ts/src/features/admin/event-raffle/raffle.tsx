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

// ─── Layout ───────────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 96;
const VISIBLE = 5;
const CENTER_SLOT = Math.floor(VISIBLE / 2);

// ─── Animation tuning ────────────────────────────────────────────────────────
const CRUISE_SPEED = 1.5; // px/ms — exciting but readable, safe for photosensitivity
const MIN_SPIN_TIME = 500; // ms — minimum cruise before braking is allowed
const BRAKE_ITEMS = 50; // slots of runway before the winner slot
const WINNER_IDX = 80; // winner is always injected this many slots deep
const BRAKE_DURATION = 5500; // ms — easing duration; longer = smoother stop

/** easeOutCubic: fast start, guaranteed stop at t=1 with zero velocity. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Winner = { name: string; round: number; timestamp: string };
type PendingWinner = DrawRaffleWinnerResponse["winner"] | null;

// ─── Reel generation ──────────────────────────────────────────────────────────

/** Unbiased Fisher-Yates shuffle — non-mutating. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tile the pool in full shuffled passes until we have `length` items.
 * Every name appears once per pass before any name repeats — visually fair.
 * A seam guard prevents the same name appearing back-to-back between passes.
 */
function buildReelPool(pool: string[], length: number): string[] {
  if (pool.length === 0) return Array(length).fill("No Participants");
  if (pool.length === 1) return Array(length).fill(pool[0]);

  const reel: string[] = [];
  while (reel.length < length) {
    const pass = shuffle(pool);
    if (
      reel.length > 0 &&
      pass[0] === reel[reel.length - 1] &&
      pass.length > 1
    ) {
      [pass[0], pass[1]] = [pass[1], pass[0]];
    }
    reel.push(...pass.slice(0, length - reel.length));
  }
  return reel;
}

/** Build the full reel with the winner injected at WINNER_IDX. */
function buildReel(pool: string[], winner: string): string[] {
  const reel = buildReelPool(pool, Math.max(160, WINNER_IDX + VISIBLE + 20));
  reel[WINNER_IDX] = winner;
  return reel;
}

/** Pixel offset at which WINNER_IDX is perfectly centered in the viewport. */
function winnerOffset(): number {
  return -((WINNER_IDX - CENTER_SLOT) * ITEM_HEIGHT);
}

// ─── Component ────────────────────────────────────────────────────────────────
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
  const [reelItems, setReelItems] = useState<string[]>(() =>
    buildReelPool([], VISIBLE + 2)
  );
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
  const fetchedWinnerRef = useRef<PendingWinner>(null);

  // ─── Load participants ───────────────────────────────────────────────────────
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
        if (pool.winners?.length) {
          const historical = pool.winners.map((w, i) => ({
            name: w.name,
            round: i + 1,
            timestamp: "Previously Drawn",
          }));
          setWinners(historical);
          setRound(historical.length + 1);
        }
        setTotalParticipants(
          (pool.eligible?.length ?? 0) + (pool.winners?.length ?? 0)
        );
        setReelItems(
          buildReelPool(
            pool.eligible.map((a) => a.name).filter(Boolean),
            VISIBLE + 2
          )
        );
      } catch {
        if (!cancelled) setLoadError("Failed to load raffle pool.");
      } finally {
        if (!cancelled) setIsLoadingParticipants(false);
      }
    };
    void loadPool();
    return () => {
      cancelled = true;
    };
  }, [normalizedEventId, selectedCampus]);

  // ─── Fullscreen ──────────────────────────────────────────────────────────────
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

  // ─── Core draw ───────────────────────────────────────────────────────────────
  const drawWinner = useCallback(() => {
    if (isSpinning || allParticipants.length === 0) return;

    setIsSpinning(true);
    setWinnerLit(false);
    setShowConfetti(false);
    fetchedWinnerRef.current = null;

    const participantNames = allParticipants.map((a) => a.name).filter(Boolean);

    // Build a large initial reel for the cruise phase.
    const initialReel = buildReelPool(participantNames, 400);
    setReelItems(initialReel);
    setIsAnimating(true);

    // ── Animation state ────────────────────────────────────────────────────────
    let phase: "cruise" | "brake" = "cruise";
    let offset = 0;
    let prevTime: number | null = null;

    // Set when braking begins:
    let brakeStartOffset = 0;
    let brakeStartTime = 0;
    let targetOffset = 0;

    // ── RAF loop ───────────────────────────────────────────────────────────────
    const tick = (now: number) => {
      const dt = prevTime === null ? 0 : Math.min(now - prevTime, 64);
      prevTime = now;

      if (phase === "cruise") {
        // Steady cruise — simple linear advance each frame.
        offset -= CRUISE_SPEED * dt;
        setReelOffset(offset);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // ── Brake phase: time-based easing, no accumulated drift ──────────────
        const elapsed = now - brakeStartTime;
        const t = Math.min(elapsed / BRAKE_DURATION, 1.0);
        const eased = easeOutCubic(t);

        // Position is always derived from the start offset — never accumulated.
        // At t=1, eased=1 exactly, so we land precisely on targetOffset.
        const currentOffset =
          brakeStartOffset + (targetOffset - brakeStartOffset) * eased;
        setReelOffset(currentOffset);

        if (t < 1.0) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // Animation complete — snap to exact pixel, no drift.
          setReelOffset(targetOffset);
          setIsAnimating(false);
          setIsSpinning(false);
          setWinnerLit(true);

          if (fetchedWinnerRef.current) {
            setShowConfetti(true);
            setPendingWinner(fetchedWinnerRef.current);
            setTimeout(() => setShowConfetti(false), 4500);
          }
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    // ── startBraking: called once when API + MIN_SPIN_TIME both resolve ────────
    const startBraking = (winnerName: string, now: number) => {
      // 1. Find which slot we're currently at.
      const currentIndex = Math.ceil(Math.abs(offset) / ITEM_HEIGHT);

      // 2. Place the winner BRAKE_ITEMS slots ahead — guaranteed runway.
      const winnerIndex = currentIndex + BRAKE_ITEMS;

      // 3. Extend the reel if needed and inject the winner name.
      setReelItems((prev) => {
        const next = [...prev];
        while (next.length <= winnerIndex + VISIBLE + 5) {
          next.push(...buildReelPool(participantNames, 100));
        }
        next[winnerIndex] = winnerName;
        return next;
      });

      // 4. Capture the exact start state for the easing calculation.
      brakeStartOffset = offset;
      brakeStartTime = now;
      targetOffset = -((winnerIndex - CENTER_SLOT) * ITEM_HEIGHT);

      // 5. Flip phase — next RAF tick uses the easing formula.
      phase = "brake";
    };

    // ── API & timer sync ───────────────────────────────────────────────────────
    const minSpinPromise = new Promise<number>((resolve) =>
      setTimeout(() => resolve(performance.now()), MIN_SPIN_TIME)
    );
    const apiPromise = drawRaffleWinner(normalizedEventId);

    Promise.all([apiPromise, minSpinPromise])
      .then(([apiResponse, resolvedAt]) => {
        fetchedWinnerRef.current = apiResponse.winner;
        startBraking(apiResponse.winner.name, resolvedAt);
      })
      .catch((error) => {
        console.error("Failed to draw from server:", error);
        startBraking("Draw Error", performance.now());
      });
  }, [isSpinning, normalizedEventId, allParticipants]);

  // ─── Winner actions ───────────────────────────────────────────────────────────
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
      setTimeout(() => {
        setIsRedrawing(false);
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
    if (
      !window.confirm(
        "Reset the entire raffle? All winners will be returned to the pool."
      )
    )
      return;
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
      setReelItems(
        buildReelPool(
          pool.eligible.map((a) => a.name).filter(Boolean),
          VISIBLE + 2
        )
      );
    } catch (error) {
      console.error("Failed to reset raffle:", error);
      alert("Failed to reset the raffle. Please try again.");
    } finally {
      setIsSpinning(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
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
        @keyframes drawPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.65; } }
        @keyframes ringPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </div>
  );
}
