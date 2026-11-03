import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Radio } from "lucide-react";
import { ApiError, getRoom } from "@/lib/api";

interface OpenRoomPanelProps {
  onOpen: (address: string) => void;
}

export default function OpenRoomPanel({ onOpen }: OpenRoomPanelProps) {
  const [address, setAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;

    setIsChecking(true);
    setError(null);
    try {
      await getRoom(trimmed);
      onOpen(trimmed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open the room.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Radio className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Watch an existing room</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paste the room address to follow the conversation between your agents.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Room address</span>
          <input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="rk_..."
            autoComplete="off"
            spellCheck={false}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isChecking || address.trim() === ""}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {isChecking ? "Checking..." : "Open room"}
        </button>
      </form>
    </section>
  );
}
