import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { toCsv, csvResponse, deDate } from "@/lib/csv";

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  disabled: boolean;
  order_count: number;
  total_spent_cents: number;
  last_order_at: string | null;
};

async function loadUsers(): Promise<AdminUser[]> {
  const db = supabaseAdmin();

  // Customer accounts live in Supabase Auth. Page through all of them.
  const authUsers: {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string | null;
    banned_until?: string | null;
  }[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    authUsers.push(...data.users);
    if (data.users.length < 200) break;
  }

  // Order totals per account (cancelled orders do not count as spend).
  const { data: orders, error: ordersError } = await db
    .from("orders")
    .select("user_id, order_number, customer_name, amount_total_cents, status, created_at")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });
  if (ordersError) throw new Error(ordersError.message);

  const stats = new Map<
    string,
    { numbers: Set<string>; spent: number; last: string | null; name: string | null }
  >();
  for (const o of orders ?? []) {
    const s =
      stats.get(o.user_id) ?? { numbers: new Set<string>(), spent: 0, last: null, name: null };
    s.numbers.add(o.order_number);
    if (o.status !== "cancelled") s.spent += o.amount_total_cents ?? 0;
    if (!s.last) s.last = o.created_at; // rows are newest first
    if (!s.name && o.customer_name) s.name = o.customer_name;
    stats.set(o.user_id, s);
  }

  const now = Date.now();
  return authUsers
    .map((u) => {
      const s = stats.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        name: s?.name ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: !!u.email_confirmed_at,
        disabled: !!u.banned_until && new Date(u.banned_until).getTime() > now,
        order_count: s?.numbers.size ?? 0,
        total_spent_cents: s?.spent ?? 0,
        last_order_at: s?.last ?? null,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// GET /api/admin/users            -> JSON list
// GET /api/admin/users?format=csv -> CSV download
export async function GET(req: NextRequest) {
  try {
    const users = await loadUsers();
    if (req.nextUrl.searchParams.get("format") === "csv") {
      const csv = toCsv(
        ["E-Mail", "Name", "Registriert", "Letzter Login", "Bestätigt", "Gesperrt", "Bestellungen", "Umsatz (EUR)", "Letzte Bestellung"],
        users.map((u) => [
          u.email,
          u.name,
          deDate(u.created_at),
          deDate(u.last_sign_in_at),
          u.confirmed ? "ja" : "nein",
          u.disabled ? "ja" : "nein",
          u.order_count,
          (u.total_spent_cents / 100).toFixed(2).replace(".", ","),
          deDate(u.last_order_at),
        ])
      );
      return csvResponse(csv, "kunden.csv");
    }
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// PATCH { id, action: "disable" | "enable" }
// Disabling blocks login (and any new session) without deleting anything.
export async function PATCH(req: NextRequest) {
  const { id, action } = await req.json();
  if (!id || (action !== "disable" && action !== "enable")) {
    return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { error } = await db.auth.admin.updateUserById(id, {
    ban_duration: action === "disable" ? "876000h" : "none",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE { id } — removes the login account. Past orders are kept (tax and
// accounting records must be retained) but detached from the account.
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = supabaseAdmin();

  const { error: detachError } = await db
    .from("orders")
    .update({ user_id: null })
    .eq("user_id", id);
  if (detachError) {
    return NextResponse.json({ error: detachError.message }, { status: 500 });
  }
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
