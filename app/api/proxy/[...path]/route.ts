import { NextRequest, NextResponse } from "next/server";

const ODOO_BASE = process.env.ODOO_BASE_URL!;
const ODOO_TOKEN = process.env.ODOO_API_TOKEN!;

// Allowed Odoo endpoints ElevenLabs tools can proxy through
const ALLOWED_PATHS = new Set([
  "api/agent/customer/identify",
  "api/agent/customer/balance",
  "api/agent/customer/invoices",
  "api/agent/orders/status",
  "api/agent/orders/create",
  "api/agent/products/search",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");

  if (!ALLOWED_PATHS.has(endpoint)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.text();

  const odooRes = await fetch(`${ODOO_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ODOO_TOKEN}`,
    },
    body,
  });

  const data = await odooRes.json();
  return NextResponse.json(data, { status: odooRes.status });
}
