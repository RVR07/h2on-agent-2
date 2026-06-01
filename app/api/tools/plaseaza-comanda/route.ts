import { NextRequest, NextResponse } from "next/server";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const p = body?.params ?? body;

    // Guard: agent must have explicit confirmation
    if (p.client_confirmed !== true && p.client_confirmed !== "true") {
      return NextResponse.json({
        ok: false,
        error: { code: "NOT_CONFIRMED", message: "Comanda nu a fost confirmată explicit de client." },
      });
    }

    const {
      telefon,
      nume_client = "Necunoscut",
      produse = [],       // [{ nume, cantitate, um }]
      adresa_livrare = "—",
      data_preferata = "—",
      metoda_plata = "—",
      observatii = "",
    } = p;

    // Format order lines
    const linii = Array.isArray(produse)
      ? produse.map((pr: { nume: string; cantitate: number; um?: string }) =>
          `  • ${pr.nume} × ${pr.cantitate}${pr.um ? " " + pr.um : ""}`
        ).join("\n")
      : String(produse);

    const now = new Date().toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const text = [
      `🛒 *COMANDĂ NOUĂ — AGENT VOCAL*`,
      `📅 ${now}`,
      ``,
      `👤 *Client:* ${nume_client}`,
      `📞 *Telefon:* ${telefon}`,
      ``,
      `📦 *Produse:*`,
      linii || "  —",
      ``,
      `🏠 *Adresă livrare:* ${adresa_livrare}`,
      `📆 *Dată preferată:* ${data_preferata}`,
      `💳 *Metodă plată:* ${metoda_plata}`,
      observatii ? `📝 *Observații:* ${observatii}` : null,
      ``,
      `_Transmisă automat de agentul vocal H2On_`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: "Markdown" }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error("Telegram error:", tgData);
      return NextResponse.json({
        ok: false,
        error: { code: "TELEGRAM_ERROR", message: tgData.description },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        message_id: tgData.result.message_id,
        status: "Comanda a fost transmisă echipei de operațiuni. Veți fi contactat în curând pentru confirmare.",
      },
    });
  } catch (err) {
    console.error("plaseaza_comanda error:", err);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "Eroare internă." } },
      { status: 500 }
    );
  }
}
