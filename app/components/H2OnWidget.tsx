"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, PhoneOff, X } from "lucide-react";

/* ─── Drop-in widget — transparent background, embeds on any website ─────── */

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

export default function H2OnWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => setIsStarting(false),
    onDisconnect: () => cancelAnimationFrame(animRef.current),
    onMessage: (msg) => {
      const text = msg.message ?? "";
      if (text.trim())
        setMessages((p) => [
          ...p,
          { id: crypto.randomUUID(), role: msg.role, text },
        ]);
    },
    onError: () => setIsStarting(false),
  });

  const { status, isSpeaking, isMuted, setMuted } = conversation;
  const isConnected = status === "connected";
  const isConnecting = status === "connecting" || isStarting;

  const start = useCallback(async () => {
    try {
      setIsStarting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const res = await fetch("/api/get-signed-url");
      const { signedUrl } = await res.json();
      await conversation.startSession({ signedUrl });
    } catch {
      setIsStarting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => start(), 300);
  };

  const handleClose = () => {
    stop();
    setOpen(false);
  };

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
        const bw = w / bars;
        const amp = isSpeaking ? 22 : 5;
        phase += isSpeaking ? 0.09 : 0.03;

        for (let i = 0; i < bars; i++) {
          const x = i * bw + bw / 2;
          const n = Math.sin(i * 0.45 + phase) * Math.sin(i * 0.18 - phase * 0.6);
          const bh = Math.abs(n) * amp + (isSpeaking ? 3 : 2);
          const g = ctx.createLinearGradient(x, h / 2 - bh, x, h / 2 + bh);
          g.addColorStop(0, "rgba(56,189,248,1)");
          g.addColorStop(1, "rgba(14,165,233,0.3)");
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

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Idle button ──────────────────────────────────────────────────────── */
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label="Deschide asistentul vocal H2On"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "68px",
          height: "68px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          padding: 0,
          boxShadow: "0 8px 32px rgba(14,165,233,0.45), 0 2px 8px rgba(0,0,0,0.2)",
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
          zIndex: 9999,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 12px 40px rgba(14,165,233,0.6), 0 2px 8px rgba(0,0,0,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 8px 32px rgba(14,165,233,0.45), 0 2px 8px rgba(0,0,0,0.2)";
        }}
      >
        {/* Pulse ring */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(56,189,248,0.6)",
            animation: "h2on-pulse 2s ease-out infinite",
          }}
        />
        {/* H2On drop icon */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z"
            fill="white"
            opacity="0.95"
          />
          <path
            d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z"
            fill="url(#drop-grad)"
            opacity="0.3"
          />
          <defs>
            <linearGradient id="drop-grad" x1="16" y1="4" x2="16" y2="29">
              <stop stopColor="#bae6fd" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
        </svg>

        <style>{`
          @keyframes h2on-pulse {
            0%   { transform: scale(1);   opacity: 0.8; }
            70%  { transform: scale(1.5); opacity: 0; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        `}</style>
      </button>
    );
  }

  /* ── Expanded panel ───────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "340px",
        borderRadius: "24px",
        overflow: "hidden",
        zIndex: 9999,
        background: "linear-gradient(160deg, rgba(2,6,23,0.96) 0%, rgba(3,30,60,0.96) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(14,165,233,0.25)",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), 0 0 40px rgba(14,165,233,0.15)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z" fill="white" />
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
              H2On
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px" }}>
              {isConnected
                ? isSpeaking
                  ? "Vorbește..."
                  : "Ascultă..."
                : isConnecting
                ? "Se conectează..."
                : "Asistent vocal"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {isConnected && (
            <button
              onClick={() => setMuted(!isMuted)}
              title={isMuted ? "Activează microfon" : "Dezactivează microfon"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.3)",
                background: isMuted ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.15)",
                color: isMuted ? "#fbbf24" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          <button
            onClick={handleClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.15)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Waveform circle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "20px 0 12px",
          position: "relative",
        }}
      >
        {/* Glow */}
        {isConnected && (
          <div
            style={{
              position: "absolute",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: isSpeaking
                ? "radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) translateY(-6px)",
              transition: "all 0.5s",
            }}
          />
        )}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: `2px solid ${isConnected ? "rgba(14,165,233,0.5)" : "rgba(255,255,255,0.08)"}`,
            background: isConnected
              ? "rgba(2,30,60,0.8)"
              : "rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
            transition: "all 0.4s",
          }}
        >
          {isConnected ? (
            <canvas ref={canvasRef} width={116} height={116} style={{ width: "100%", height: "100%" }} />
          ) : isConnecting ? (
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "3px solid rgba(14,165,233,0.3)",
                borderTopColor: "#0ea5e9",
                animation: "h2on-spin 0.8s linear infinite",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: "0 auto 4px" }}>
                <path d="M16 4C16 4 7 14 7 20a9 9 0 0018 0C25 14 16 4 16 4z"
                  fill="rgba(255,255,255,0.2)" />
              </svg>
              <div style={{ fontSize: "9px" }}>H2On</div>
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {messages.length > 0 && (
        <div
          style={{
            maxHeight: "160px",
            overflowY: "auto",
            padding: "0 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {messages.slice(-6).map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "8px 12px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  background:
                    msg.role === "user"
                      ? "rgba(14,165,233,0.2)"
                      : "rgba(255,255,255,0.07)",
                  border:
                    msg.role === "user"
                      ? "1px solid rgba(14,165,233,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: msg.role === "user" ? "#bae6fd" : "rgba(255,255,255,0.8)",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          gap: "8px",
        }}
      >
        {isConnected ? (
          <button
            onClick={stop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              borderRadius: "20px",
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
            }}
          >
            <PhoneOff size={14} />
            Închide
          </button>
        ) : (
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            {isConnecting ? "Inițializare..." : "Apăsați X pentru a închide"}
          </div>
        )}
      </div>

      <style>{`
        @keyframes h2on-spin  { to { transform: rotate(360deg); } }
        @keyframes h2on-pulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
