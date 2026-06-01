"use client";

import { ConversationProvider } from "@elevenlabs/react";
import VoiceAgent from "./components/VoiceAgent";
import InfoCard from "./components/InfoCard";
import { Droplets, FileText, ShoppingCart, PhoneCall } from "lucide-react";

export default function Home() {
  return (
    <ConversationProvider>
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white">
        {/* Background decorative blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-600/10 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-700/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 flex flex-col gap-10">
          {/* Header */}
          <header className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-sky-400" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">H2On</h1>
                <p className="text-xs text-sky-400 font-medium tracking-wider uppercase">
                  Agent Vocal AI
                </p>
              </div>
            </div>
            <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
              Serviciu automat de asistență pentru clienți. Verifică facturi, solduri, comenzi și
              plasează comenzi noi — 24/7.
            </p>
          </header>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Left — info cards */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-1">
                Ce poate face agentul
              </h2>

              <InfoCard
                icon={<FileText className="w-4 h-4" />}
                title="Facturi & solduri"
                description="Verifică facturile tale plătite sau neachitate și soldul restant în timp real."
              />
              <InfoCard
                icon={<ShoppingCart className="w-4 h-4" />}
                title="Comenzi"
                description="Urmărește statusul comenzilor existente sau plasează o comandă nouă de apă H2On."
              />
              <InfoCard
                icon={<PhoneCall className="w-4 h-4" />}
                title="Escaladare operator"
                description="Dacă ai nevoie de ajutor suplimentar, agentul te conectează cu un operator uman."
              />
              <InfoCard
                icon={<Droplets className="w-4 h-4" />}
                title="Catalog produse"
                description="Caută produse disponibile — bidoane, dozatoare, consumabile — cu prețuri actualizate."
              />

              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 leading-relaxed">
                <strong className="text-amber-300">Înainte de a apela:</strong> asigură-te că browserul
                are acces la microfon. Vei fi rugat să confirmi permisiunea la prima apelare.
              </div>
            </div>

            {/* Right — voice agent */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
              <VoiceAgent />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-white/25 pb-4">
            © {new Date().getFullYear()} H2On · Powered by ElevenLabs AI
          </footer>
        </div>
      </main>
    </ConversationProvider>
  );
}
