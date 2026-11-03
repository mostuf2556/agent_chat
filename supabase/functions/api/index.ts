import { createClient } from "npm:@supabase/supabase-js@2";
import { openApiSpec } from "./openapi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ADDRESS_PATTERN = /^rk_[A-Za-z0-9_-]{43}$/;

type Json = Record<string, unknown> | unknown[];

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const notFound = () => json({ error: "not_found" }, 404);
const invalidInput = () => json({ error: "invalid_input" }, 400);

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateAddress() {
  return `rk_${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`;
}

async function hashAddress(address: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function findRoom(address: string) {
  if (!ADDRESS_PATTERN.test(address)) return null;
  const { data, error } = await supabase
    .from("rooms")
    .select("id, label, created_at")
    .eq("address_hash", await hashAddress(address))
    .maybeSingle();
  if (error) throw error;
  return data;
}

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length >= 1 && value.length <= max;
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

function toMessageDto(row: {
  id: number;
  agent: string;
  body: string;
  files: string[];
  created_at: string;
}) {
  return {
    id: row.id,
    agent: row.agent,
    body: row.body,
    files: row.files,
    createdAt: row.created_at,
  };
}

async function createRoom(req: Request) {
  const body = await readJsonBody(req);
  const input = body === undefined ? {} : body;
  if (typeof input !== "object" || input === null || Array.isArray(input)) return invalidInput();

  const rawLabel = (input as { label?: unknown }).label;
  if (rawLabel !== undefined && !isNonEmptyString(rawLabel, 80)) return invalidInput();
  const label = typeof rawLabel === "string" ? rawLabel.trim() : null;

  const address = generateAddress();
  const { data, error } = await supabase
    .from("rooms")
    .insert({ address_hash: await hashAddress(address), label })
    .select("label, created_at")
    .single();
  if (error) throw error;

  return json({ address, label: data.label, createdAt: data.created_at }, 201);
}

async function getRoom(address: string) {
  const room = await findRoom(address);
  if (!room) return notFound();
  return json({ label: room.label, createdAt: room.created_at });
}

async function listMessages(address: string, url: URL) {
  const room = await findRoom(address);
  if (!room) return notFound();

  const afterParam = url.searchParams.get("after") ?? "0";
  const limitParam = url.searchParams.get("limit") ?? "100";
  if (!/^\d+$/.test(afterParam) || !/^\d+$/.test(limitParam)) return invalidInput();
  const after = Number(afterParam);
  const limit = Number(limitParam);
  if (limit < 1 || limit > 200) return invalidInput();

  const { data, error } = await supabase
    .from("messages")
    .select("id, agent, body, files, created_at")
    .eq("room_id", room.id)
    .gt("id", after)
    .order("id", { ascending: true })
    .limit(limit);
  if (error) throw error;

  const messages = data.map(toMessageDto);
  const nextAfter = messages.length > 0 ? messages[messages.length - 1].id : after;
  return json({ messages, nextAfter });
}

async function postMessage(address: string, req: Request) {
  const room = await findRoom(address);
  if (!room) return notFound();

  const body = await readJsonBody(req);
  if (typeof body !== "object" || body === null || Array.isArray(body)) return invalidInput();
  const input = body as { agent?: unknown; body?: unknown; files?: unknown };

  if (!isNonEmptyString(input.agent, 64)) return invalidInput();
  if (!isNonEmptyString(input.body, 8000)) return invalidInput();

  const files = input.files ?? [];
  if (
    !Array.isArray(files) ||
    files.length > 50 ||
    !files.every((file) => isNonEmptyString(file, 300))
  ) {
    return invalidInput();
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: room.id,
      agent: input.agent.trim(),
      body: input.body,
      files: files.map((file) => file.trim()),
    })
    .select("id, agent, body, files, created_at")
    .single();
  if (error) throw error;

  return json(toMessageDto(data), 201);
}

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*?\/api(?=\/|$)/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (req.method === "GET" && path === "/openapi.json") return json(openApiSpec);

  if (segments[0] !== "rooms") return notFound();

  if (segments.length === 1 && req.method === "POST") return createRoom(req);

  const address = segments[1] ?? "";

  if (segments.length === 2 && req.method === "GET") return getRoom(address);

  if (segments.length === 3 && segments[2] === "messages") {
    if (req.method === "GET") return listMessages(address, url);
    if (req.method === "POST") return postMessage(address, req);
  }

  return notFound();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    return await route(req);
  } catch (err) {
    console.error("api error", err);
    return json({ error: "internal_error" }, 500);
  }
});
