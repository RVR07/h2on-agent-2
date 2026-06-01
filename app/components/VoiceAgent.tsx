"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

export default function VoiceAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const conversation = useConversation({
    onConnect: () => {
      setIsStarting(false);
    },
    onDisconnect: () => {
      cancelAnimationFrame(animFrameRef.current);
    },
    onMessage: (message) => {
      const text = message.message ?? "";
      if (text.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: message.role,
            text,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setIsStarting(false);
    },
  });

  const { status, isSpeaking, isMuted, setMuted } = conversation;
  const isConnected = status === "connected";
  const isConnecting = status === "connecting" || isStarting;

  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch("/api/get-signed-url");
    if (!response.ok) throw new Error("Failed to get signed URL");
    const { signedUrl } = await response.json();
    return signedUrl;
  };

  const startConversation = useCallback(async () => {
    try {
      setIsStarting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const signedUrl = await getSignedUrl();
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsStarting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  // Waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (!isConnected) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const amplitude = isSpeaking ? 28 : 6;
      const bars = 48;
      const barW = width / bars;
      const speed = isSpeaking ? 0.08 : 0.03;
      phase += speed;

      for (let i = 0; i < bars; i++) {
        const x = i * barW + barW / 2;
        const noise = Math.sin(i * 0.4 + phase) * Math.sin(i * 0.15 - phase * 0.7);
        const h = Math.abs(noise) * amplitude + (isSpeaking ? 4 : 2);

        const gradient = ctx.createLinearGradient(x, height / 2 - h, x, height / 2 + h);
        gradient.addColorStop(0, "rgba(14, 165, 233, 0.9)");
        gradient.addColorStop(1, "rgba(56, 189, 248, 0.3)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x - barW * 0.3, height / 2 - h, barW * 0.6, h * 2, 4);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isConnected, isSpeaking]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Status pill */}
      <div className="flex justify-center">
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            isConnected
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : isConnecting
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
              : "bg-white/10 text-white/50 border border-white/10"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-emerald-400 animate-pulse"
                : isConnecting
                ? "bg-sky-400 animate-pulse"
                : "bg-white/30"
            }`}
          />
          {isConnected
            ? isSpeaking
              ? "Agentul vorbește..."
              : "Ascult..."
            : isConnecting
            ? "Se conectează..."
            : "Deconectat"}
        </div>
      </div>

      {/* Waveform */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              isConnected
                ? isSpeaking
                  ? "shadow-[0_0_60px_20px_rgba(14,165,233,0.35)] scale-105"
                  : "shadow-[0_0_30px_8px_rgba(14,165,233,0.15)]"
                : "opacity-0"
            }`}
          />

          <div
            className={`relative w-52 h-52 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-500 ${
              isConnected
                ? "border-sky-500/60 bg-slate-900/80"
                : "border-white/10 bg-white/5"
            }`}
          >
            {isConnected ? (
              <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
            ) : isConnecting ? (
              <Loader2 className="w-14 h-14 text-sky-400 animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/30">
                <Phone className="w-14 h-14" />
                <span className="text-xs">Pornește convorbirea</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isConnected && !isConnecting ? (
          <button
            onClick={startConversation}
            className="flex items-center gap-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-sky-500/30 transition-all duration-200"
          >
            <Phone className="w-5 h-5" />
            Pornește convorbirea
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted(!isMuted)}
              className={`p-3.5 rounded-full border-2 transition-all duration-200 active:scale-95 ${
                isMuted
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }`}
              title={isMuted ? "Activează microfonul" : "Dezactivează microfonul"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={stopConversation}
              disabled={isConnecting}
              className="flex items-center gap-2.5 bg-red-500 hover:bg-red-400 active:scale-95 disabled:opacity-50 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-red-500/30 transition-all duration-200"
            >
              <PhoneOff className="w-5 h-5" />
              Închide
            </button>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageSquare className="w-4 h-4 text-white/40" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Transcriere conversație
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px] max-h-[300px] scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm gap-2 py-8">
              <Volume2 className="w-8 h-8" />
              <span>Transcrierea va apărea aici</span>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">
                    {msg.role === "user" ? "Tu" : "Agent H2On"}
                  </span>
                  <span className="text-xs text-white/20">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-sky-500/25 text-sky-100 border border-sky-500/20"
                      : "bg-white/10 text-white/85 border border-white/10"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
