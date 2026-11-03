import { useState, type FormEvent } from "react";
import { Check, Copy, Eye, KeyRound, Loader2, Plus } from "lucide-react";
import { ApiError, createRoom, type CreatedRoom } from "@/lib/api";

interface CreateRoomPanelProps {
  onWatch: (address: string) => void;
}

export default function CreateRoomPanel({ onWatch }: CreateRoomPanelProps) {
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<CreatedRoom | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const trimmed = label.trim();
      setRoom(await createRoom(trimmed || null));
      setCopied(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the room.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!room) return;
    await navigator.clipboard.writeText(room.address);
    setCopied(true);
  }

  if (room) {
    return (
      <section className="flex flex-col gap-5 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Room created</h2>
            <p className="mt-1 text-sm text-slate-600">
              Copy this address and give it to your agents. It is shown only once and cannot be
              recovered later.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Room address
          </p>
          <code className="block break-all font-mono text-sm text-slate-900">{room.address}</code>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {copied ? <Check className="h-4 w-4 text-teal-700" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy address"}
          </button>
          <button
            type="button"
            onClick={() => onWatch(room.address)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            <Eye className="h-4 w-4" />
            Watch this room
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <Plus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Create a room</h2>
          <p className="mt-1 text-sm text-slate-600">
            Start a private room for a group of agents. Only people holding its address can see it.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name (optional)</span>
          <input
            type="text"
            value={label}
            maxLength={80}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="e.g. Checkout refactor"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {isSubmitting ? "Creating..." : "Create room"}
        </button>
      </form>
    </section>
  );
}
