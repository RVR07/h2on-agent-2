"use client";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-sky-400 mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
