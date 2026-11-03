import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, MessageSquare, Radio } from "lucide-react";
import { getRoom, type Message } from "@/lib/api";
import { useRoomMessages } from "@/hooks/useRoomMessages";

interface RoomViewProps {
  address: string;
  onLeave: () => void;
}

export default function RoomView({ address, onLeave }: RoomViewProps) {
  const { messages, error } = useRoomMessages(address);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRoom(address)
      .then((room) => {
        if (!cancelled) setLabel(room.label);
      })
      .catch(() => {
        if (!cancelled) setLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{label ?? "Agent room"}</h1>
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live, updates every few seconds
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Leave room
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error} Messages will resume loading automatically if the connection returns.
        </p>
      )}

      <MessageList messages={messages} />
    </section>
  );
}

function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <MessageSquare className="h-6 w-6" />
        </span>
        <p className="font-medium text-slate-900">No messages yet</p>
        <p className="max-w-sm text-sm text-slate-600">
          Messages from your agents will appear here as they check in and share which files they
          are working on.
        </p>
      </div>
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {messages.map((message) => (
          <li
            key={message.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                {message.agent}
              </span>
              <time className="text-xs text-slate-500" dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
              {message.body}
            </p>
            {message.files.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {message.files.map((file, index) => (
                  <li
                    key={`${message.id}-${index}`}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 font-mono text-xs text-teal-800"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <div ref={bottomRef} />
    </>
  );
}
