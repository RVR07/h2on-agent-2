"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Phone, PhoneOff, X } from "lucide-react";

/* ── Color tokens ────────────────────────────────────────────────────────── */
const C = {
  navy:        "#0d1b2a",
  navyLight:   "#142536",
  navyLighter: "#1a2d42",
  gold:        "#c09449",
  goldLight:   "#d4a85a",
  white:       "#ffffff",
  grayLight:   "#e5e7eb",
  gray:        "#9ca3af",
  border:      "#2a3f54",
  red:         "#ef4444",
};

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

export default function H2OnWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const animRef        = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const normalize = (t: string) => t.replace(/H\s*2\s*On/gi, "H2On");

  const conversation = useConversation({
    onConnect:    () => setIsStarting(false),
    onDisconnect: () => cancelAnimationFrame(animRef.current),
    onMessage: (msg) => {
      const text = normalize(msg.message ?? "");
      if (text.trim())
        setMessages((p) => [...p, { id: crypto.randomUUID(), role: msg.role, text }]);
    },
    onError: () => setIsStarting(false),
  });

  const { status, isSpeaking, isMuted, setMuted } = conversation;
  const isConnected  = status === "connected";
  const isConnecting = status === "connecting" || isStarting;

  const start = useCallback(async () => {
    try {
      setIsStarting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/get-signed-url");
      const { signedUrl } = await res.json();
      await conversation.startSession({ signedUrl });
    } catch { setIsStarting(false); }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  // Hang up only — keeps panel open
  const hangUp = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  // Close panel (and end call if active)
  const handleClose = useCallback(async () => {
    if (isConnected || isConnecting) await conversation.endSession();
    setOpen(false);
    setMessages([]);
  }, [conversation, isConnected, isConnecting]);

  useEffect(() => {
    window.parent.postMessage({ type: "h2on-resize", open }, "*");
  }, [open]);

  const handleOpen = () => { setOpen(true); setTimeout(() => start(), 300); };

  /* Waveform */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let phase = 0;
    const draw = () => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      if (isConnected) {
        const bars = 40;
        const bw   = w / bars;
        const amp  = isSpeaking ? 22 : 5;
        phase += isSpeaking ? 0.09 : 0.03;
        for (let i = 0; i < bars; i++) {
          const x  = i * bw + bw / 2;
          const n  = Math.sin(i * 0.45 + phase) * Math.sin(i * 0.18 - phase * 0.6);
          const bh = Math.abs(n) * amp + (isSpeaking ? 3 : 2);
          const g  = ctx.createLinearGradient(x, h / 2 - bh, x, h / 2 + bh);
          g.addColorStop(0, C.goldLight);
          g.addColorStop(1, C.gold + "55");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(x - bw * 0.28, h / 2 - bh, bw * 0.56, bh * 2, 3);
          ctx.fill();
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isConnected, isSpeaking]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ── Idle button ──────────────────────────────────────────────────────── */
  if (!open) return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Deschide asistentul vocal H2On"
        style={{
          position: "fixed", bottom: "28px", right: "28px",
          width: "68px", height: "68px", borderRadius: "50%",
          border: `2px solid ${C.gold}`,
          cursor: "pointer", padding: 0, zIndex: 9999,
          background: `linear-gradient(135deg, ${C.navyLight} 0%, ${C.navy} 100%)`,
          boxShadow: `0 8px 32px rgba(192,148,73,0.35), 0 2px 12px rgba(0,0,0,0.4)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.transform  = "scale(1.08)";
          b.style.boxShadow  = `0 12px 40px rgba(192,148,73,0.55), 0 2px 12px rgba(0,0,0,0.5)`;
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.transform  = "scale(1)";
          b.style.boxShadow  = `0 8px 32px rgba(192,148,73,0.35), 0 2px 12px rgba(0,0,0,0.4)`;
        }}
      >
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `2px solid ${C.goldLight}88`,
          animation: "h2on-pulse 2.2s ease-out infinite",
        }} />
        {/* Water drop icon */}
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <path d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z"
            fill={C.gold} />
          <path d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z"
            fill={`url(#dg)`} opacity="0.4" />
          <defs>
            <linearGradient id="dg" x1="16" y1="4" x2="16" y2="29">
              <stop stopColor={C.goldLight} />
              <stop offset="1" stopColor={C.navy} />
            </linearGradient>
          </defs>
        </svg>
      </button>

      <style>{`
        @keyframes h2on-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0;   }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </>
  );

  /* ── Expanded panel ───────────────────────────────────────────────────── */
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      width: "340px", borderRadius: "20px", overflow: "hidden",
      zIndex: 9999,
      background: C.navyLight,
      border: `1px solid ${C.border}`,
      boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(192,148,73,0.1), 0 0 40px rgba(192,148,73,0.08)`,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(90deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
        borderBottom: `1px solid ${C.border}`,
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%",
            border: `1.5px solid ${C.gold}`,
            background: C.navyLighter,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z" fill={C.gold} />
            </svg>
          </div>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
              H2On
            </div>
            <div style={{ color: C.gray, fontSize: "11px" }}>
              {isConnected
                ? isSpeaking ? "Vorbește..." : "Ascultă..."
                : isConnecting ? "Se conectează..."
                : "Asistent vocal"}
            </div>
          </div>
        </div>

        {/* Status dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: isConnected ? "#22c55e" : isConnecting ? C.gold : C.border,
            boxShadow: isConnected ? "0 0 6px #22c55e" : isConnecting ? `0 0 6px ${C.gold}` : "none",
            transition: "all 0.3s",
          }} />

          {isConnected && (
            <button onClick={() => setMuted(!isMuted)} title={isMuted ? "Activează" : "Dezactivează"} style={{
              width: "30px", height: "30px", borderRadius: "50%",
              border: `1px solid ${isMuted ? C.gold : C.border}`,
              background: isMuted ? C.gold + "22" : C.navyLighter,
              color: isMuted ? C.gold : C.gray,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
            </button>
          )}

          <button onClick={handleClose} style={{
            width: "30px", height: "30px", borderRadius: "50%",
            border: `1px solid ${C.border}`,
            background: C.navyLighter,
            color: C.gray, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Waveform circle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "22px 0 14px", position: "relative" }}>
        {isConnected && (
          <div style={{
            position: "absolute",
            width: "150px", height: "150px", borderRadius: "50%",
            background: isSpeaking
              ? `radial-gradient(circle, ${C.gold}22 0%, transparent 70%)`
              : `radial-gradient(circle, ${C.gold}0d 0%, transparent 70%)`,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%) translateY(-4px)",
            transition: "all 0.5s",
          }} />
        )}

        <div style={{
          width: "120px", height: "120px", borderRadius: "50%",
          border: `2px solid ${isConnected ? C.gold + "66" : C.border}`,
          background: C.navy,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", position: "relative",
          transition: "border-color 0.4s",
          boxShadow: isConnected ? `0 0 20px ${C.gold}22` : "none",
        }}>
          {isConnected ? (
            <canvas ref={canvasRef} width={116} height={116} style={{ width: "100%", height: "100%" }} />
          ) : isConnecting ? (
            <div style={{
              width: "34px", height: "34px", borderRadius: "50%",
              border: `2px solid ${C.border}`,
              borderTopColor: C.gold,
              animation: "h2on-spin 0.8s linear infinite",
            }} />
          ) : (
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z"
                fill={C.gold} opacity="0.4" />
            </svg>
          )}
        </div>
      </div>

      {/* Transcript */}
      {messages.length > 0 && (
        <div style={{
          maxHeight: "160px", overflowY: "auto",
          padding: "0 14px 12px",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          {messages.slice(-6).map((msg) => (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "85%", padding: "8px 12px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                fontSize: "12px", lineHeight: 1.5,
                background: msg.role === "user" ? C.gold + "22" : C.navyLighter,
                border: `1px solid ${msg.role === "user" ? C.gold + "44" : C.border}`,
                color: msg.role === "user" ? C.goldLight : C.grayLight,
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "10px 14px 16px",
        borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "center", gap: "10px",
      }}>
        {isConnected ? (
          <>
            <button onClick={hangUp} style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "9px 20px", borderRadius: "20px", border: "none",
              background: `linear-gradient(135deg, ${C.red}, #dc2626)`,
              color: C.white, fontWeight: 600, fontSize: "13px",
              cursor: "pointer",
              boxShadow: `0 4px 16px rgba(239,68,68,0.3)`,
            }}>
              <PhoneOff size={14} />
              Închide apelul
            </button>
          </>
        ) : isConnecting ? (
          <div style={{ fontSize: "11px", color: C.gray }}>Inițializare...</div>
        ) : (
          <button onClick={start} style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "9px 20px", borderRadius: "20px", border: "none",
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
            color: C.navy, fontWeight: 700, fontSize: "13px",
            cursor: "pointer",
            boxShadow: `0 4px 16px rgba(192,148,73,0.35)`,
          }}>
            <Phone size={14} />
            Sună
          </button>
        )}
      </div>

      <style>{`
        @keyframes h2on-spin  { to { transform: rotate(360deg); } }
        @keyframes h2on-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0;   }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
