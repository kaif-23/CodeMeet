import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../utils/SocketProvider.js.js";
import { Video, Users, ArrowRight, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [errors, setErrors] = useState({});
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const generateRoomid = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const raw = Array.from({ length: 16 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
    setRoom(formatted);
    toast.success(`Room ID generated: ${formatted}`);
  };

  const copyRoomIdToClipboard = () => {
    if (!room) {
      toast.error("No Room ID to copy!");
      return;
    }
    navigator.clipboard.writeText(room).then(() => {
      toast.success("Room ID copied to clipboard!");
    });
  };

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}/${email}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <Toaster />
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="bg-white/70 backdrop-blur-xl border border-blue-100 shadow-2xl rounded-3xl p-8">
          <div className="text-left mb-8 space-y-2">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold tracking-wide">
              <Video className="w-5 h-5" />
              CodeMeet
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Join your meeting space</h1>
            <p className="text-slate-500">Secure rooms, synced code, and face-to-face collaboration in one sleek place.</p>
            <div className="flex gap-3 pt-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">Real-time editor</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">Calls + screen share</span>
            </div>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div>
              <label
                htmlFor="roomId"
                className="block text-sm font-semibold text-slate-700 mb-2">
                Room ID
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  id="roomId"
                  name="roomId"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-xl border bg-white/80 ${
                    errors.roomId ? "border-red-500" : "border-blue-100"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner`}
                  placeholder="Enter or paste a room ID"
                />
                <button
                  type="button"
                  onClick={copyRoomIdToClipboard}
                  className="ml-2 bg-blue-50 hover:bg-blue-100 p-3 rounded-xl transition-colors border border-blue-100 shadow-sm">
                  <Copy className="w-4 h-4 text-blue-700" />
                </button>
              </div>
              {errors.roomId && (
                <p className="mt-1 text-sm text-red-500">{errors.roomId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-slate-700 mb-2">
                Your name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/80 ${
                    errors.username ? "border-red-500" : "border-blue-100"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner`}
                  placeholder="How should others see you?"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all">
              Join room
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-blue-100">
            <p className="text-sm text-slate-500 text-center">
              Need a fresh room?{' '}
              <button
                onClick={generateRoomid}
                className="text-blue-700 hover:text-blue-800 font-semibold">
                Generate ID
              </button>
            </p>
          </div>
        </div>

        <div className="hidden md:block space-y-4 text-slate-700">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-3xl p-8 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.2em] opacity-80">Live preview</p>
            <h2 className="text-3xl font-bold mt-2">Collaborate in real-time</h2>
            <p className="mt-3 text-blue-50">Share code, screens, and ideas without losing sync. CodeMeet keeps everyone in the same flow.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">Latency optimized</div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">Live compiler</div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">Secure rooms</div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">Video + audio</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shadow-inner">
              <Video className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-xs uppercase text-blue-600 tracking-wide font-semibold">Trusted sync</p>
              <p className="font-semibold text-slate-800">Built for latency-sensitive pairing and quick standups.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
