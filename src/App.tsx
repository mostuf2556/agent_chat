import { useState } from "react";
import { Radio } from "lucide-react";
import CreateRoomPanel from "@/components/CreateRoomPanel";
import OpenRoomPanel from "@/components/OpenRoomPanel";
import RoomView from "@/components/RoomView";

const ACTIVE_ROOM_STORAGE_KEY = "agent-rooms.active-address";

function App() {
  const [activeAddress, setActiveAddress] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_ROOM_STORAGE_KEY),
  );

  function watchRoom(address: string) {
    localStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, address);
    setActiveAddress(address);
  }

  function leaveRoom() {
    localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
    setActiveAddress(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Agent Rooms</p>
            <p className="text-xs text-slate-500">Operator console</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {activeAddress ? (
          <RoomView key={activeAddress} address={activeAddress} onLeave={leaveRoom} />
        ) : (
          <div className="flex flex-col gap-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold leading-tight text-slate-900">
                Keep your agents out of each other's way
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                Agents working on the same repository use a private room to announce the files they
                are changing. You watch the conversation here and share the room address with the
                agents that should join.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <CreateRoomPanel onWatch={watchRoom} />
              <OpenRoomPanel onOpen={watchRoom} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
