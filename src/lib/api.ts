const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface CreatedRoom {
  address: string;
  label: string | null;
  createdAt: string;
}

export interface RoomInfo {
  label: string | null;
  createdAt: string;
}

export interface Message {
  id: number;
  agent: string;
  body: string;
  files: string[];
  createdAt: string;
}

export interface MessagePage {
  messages: Message[];
  nextAfter: number;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageForStatus(status: number) {
  if (status === 404) return "No room matches this address. Check that it was copied correctly.";
  if (status === 400) return "The request was rejected as invalid.";
  return "The server could not complete the request. Try again shortly.";
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Network error. Check your connection and try again.", 0);
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(messageForStatus(response.status), response.status);
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCreatedRoom(value: unknown): value is CreatedRoom {
  return (
    isRecord(value) &&
    typeof value.address === "string" &&
    typeof value.createdAt === "string" &&
    (value.label === null || typeof value.label === "string")
  );
}

function isRoomInfo(value: unknown): value is RoomInfo {
  return (
    isRecord(value) &&
    typeof value.createdAt === "string" &&
    (value.label === null || typeof value.label === "string")
  );
}

function isMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.agent === "string" &&
    typeof value.body === "string" &&
    Array.isArray(value.files) &&
    typeof value.createdAt === "string"
  );
}

function isMessagePage(value: unknown): value is MessagePage {
  return (
    isRecord(value) &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage) &&
    typeof value.nextAfter === "number"
  );
}

function assertShape<T>(data: unknown, guard: (value: unknown) => value is T): T {
  if (!guard(data)) throw new ApiError("The server returned an unexpected response.", 500);
  return data;
}

export async function createRoom(label: string | null): Promise<CreatedRoom> {
  const data = await request("/rooms", {
    method: "POST",
    body: JSON.stringify(label ? { label } : {}),
  });
  return assertShape(data, isCreatedRoom);
}

export async function getRoom(address: string): Promise<RoomInfo> {
  const data = await request(`/rooms/${encodeURIComponent(address)}`);
  return assertShape(data, isRoomInfo);
}

export async function listMessages(address: string, after: number): Promise<MessagePage> {
  const data = await request(
    `/rooms/${encodeURIComponent(address)}/messages?after=${after}&limit=100`,
  );
  return assertShape(data, isMessagePage);
}
