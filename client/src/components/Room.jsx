import React, { useEffect, useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../services/Peer.js";
import { useSocket } from "../utils/SocketProvider.js.js";
import Editor from "./EditorPage.js";
import { useParams, useNavigate } from "react-router-dom";
import { Toast, toast, Toaster } from "react-hot-toast";
import Dialog from "./DialogBox.jsx";
import ExecuteCode from "./ExecuteCode.js";
import {
  Camera,
  Mic,
  MicOff,
  Monitor,
  Phone,
  VideoOff,
  Code,
  Maximize2,
  Minimize2,
  X,
  Play,
  Video,
} from "lucide-react";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(false);
  const { roomId, email } = useParams();
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteEmail, setRemoteEmail] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState(null);
  const codeRef = useRef("");
  const [isCompiling, setIsCompiling] = useState(false);
  // only for ui realted components
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const requestMediaStream = useCallback(async () => {
    if (myStream) return myStream;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      setMyStream(stream);
      return stream;
    } catch (err) {
      console.error("Primary media request failed", err);
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        toast.error("Camera is busy or unavailable. Joined with audio only.");
        setIsVideoOff(true);
        setMyStream(audioOnly);
        return audioOnly;
      } catch (fallbackErr) {
        console.error("Audio-only request also failed", fallbackErr);
        toast.error("Could not start audio/video. Check permissions or close apps using the camera.");
        return null;
      }
    }
  }, [myStream]);
  const handleUserJoined = useCallback(
    ({ email, id }) => {
      console.log(`Email ${email} joined room`, id);
      socket.emit("sync:code", { id, code: codeRef.current || "" });
      socket.emit("user:audio:toggle", { to: id, isMuted, email });
      socket.emit("user:video:toggle", { to: id, isVideoOff, email });
      setRemoteSocketId(id);
      setRemoteEmail(email);
      setShowDialog(true);
      socket.emit("wait:for:call", { to: id, email });
    },
    [socket, isMuted, isVideoOff]
  );

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) {
      toast.error("No participant available to call yet.");
      return;
    }
    try {
      const stream = await requestMediaStream();
      if (!stream) return;
      const offer = await peer.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer, email });
      setShowDialog(false);
    } catch (err) {
      console.error("getUserMedia failed", err);
      toast.error("Camera/mic unavailable. Check permissions or close other apps using the camera.");
    }
  }, [remoteSocketId, socket, requestMediaStream]);

  const handleIncommingCall = useCallback(
    async ({ from, offer, fromEmail }) => {
      setRemoteSocketId(from);

      try {
        const stream = await requestMediaStream();
        if (!stream) {
          socket.emit("call:failed", { to: from, reason: "Camera/mic unavailable" });
          return;
        }
        setIncomingCall(true);
        setRemoteEmail(fromEmail);
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
      } catch (err) {
        console.error("Failed to start camera/mic for incoming call", err);
        toast.error("Could not start video source. Check camera permissions or availability.");
        socket.emit("call:failed", { to: from, reason: "Camera/mic unavailable" });
      }
    },
    [socket, requestMediaStream]
  );

  const sendStreams = useCallback(() => {
    if (!myStream) return;
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      if (!ans) {
        toast.error("Call could not start on the other side (camera/mic issue).");
        return;
      }
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:failed", ({ reason }) => {
      toast.error(reason || "Call failed to start on the other side.");
    });
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    const handleUserLeft = ({ email }) => {
      toast(`${email} has left the room.`, {
        icon: "👋",
      });
      console.log(`${email} has left the room.`);
      // You can also reset state or perform other actions if necessary
      if (remoteSocketId) {
        setRemoteSocketId(null);
        setRemoteEmail(null);
        setRemoteStream(null);
        setRemoteMuted(false);
        setRemoteVideoOff(false);
      }
    };

    socket.on("user:left", handleUserLeft);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:failed");
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("user:left", handleUserLeft);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    remoteSocketId,
  ]);
  // Automatically trigger sendStreams when incomingCall is true
  useEffect(() => {
    setTimeout(() => {
      if (incomingCall) {
        sendStreams();
        setIncomingCall(false); // Reset incoming call to avoid repeated execution
      }
    }, 2000);
  }, [incomingCall, sendStreams]);
  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff; // Toggle video track locally
      }
      // Notify the remote peer of the video state change
      socket.emit("user:video:toggle", {
        to: remoteSocketId,
        isVideoOff: !isVideoOff,
        email: email,
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !nextMuted;
      }
    }
    if (remoteSocketId) {
      socket.emit("user:audio:toggle", {
        to: remoteSocketId,
        isMuted: nextMuted,
        email,
      });
    }
    setIsMuted(nextMuted);
  };

  // Listen for video state changes
  useEffect(() => {
    socket.on("remote:video:toggle", ({ isVideoOff, email }) => {
      if (remoteEmail === email) {
        // Update remote stream state or UI for the remote user
        setRemoteVideoOff(isVideoOff);
        setRemoteStream((prevStream) => {
          if (!prevStream) return prevStream;
          const videoTracks = prevStream.getVideoTracks();
          if (videoTracks.length > 0) {
            videoTracks[0].enabled = !isVideoOff; // Toggle remote video track
          }
          return prevStream;
        });
      }
    });
    socket.on("remote:audio:toggle", ({ isMuted, email }) => {
      if (remoteEmail === email) {
        setRemoteMuted(isMuted);
      }
    });
    socket.on("wait:for:call", ({ from, email }) => {
      toast("wait untill someone let u in");
    });
    return () => {
      socket.off("remote:video:toggle");
      socket.off("remote:audio:toggle");
      socket.off("wait:for:call");
    };
  }, [socket, remoteEmail]);
  const handleLeaveRoom = () => {
    socket.emit("leave:room", { roomId, email });
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }
   
    // Reset the state
    setRemoteSocketId(null);
    setRemoteEmail(null);
    setRemoteStream(null);
    setRemoteMuted(false);
    navigate("/");
  };

 const showScreen = async () => {
  console.log("inside")
  try {
    // Request access to display media (screen sharing)
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false, // Change to true if you want to share audio
    });

    // Get the screen track
    const screenTrack = screenStream.getVideoTracks()[0];

    if (screenTrack) {
      // Replace the current video track in the myStream
      const sender = peer.peer
        .getSenders()
        .find((s) => s.track.kind === "video");

      if (sender) {
        sender.replaceTrack(screenTrack); // Update the sender's track
        
      }

      // Stop the screen sharing when the track ends
      screenTrack.onended = () => {
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack && sender) {
          sender.replaceTrack(videoTrack); // Revert to the original video track
        }
      };
    }
  } catch (error) {
    console.error("Error while sharing screen:", error);
  }
};

  return (
    <div>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex flex-col md:flex-row text-slate-100">
        <div
          className={`flex-1 p-4 sm:p-5 pb-24 sm:pb-28 transition-all duration-300 ${
            isEditorOpen ? "w-full md:w-[60%]" : "w-full"
          }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-blue-200/80">CodeMeet</p>
                <p className="font-semibold text-lg text-white">Room {roomId}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-300">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30">Live</span>
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">{email}</span>
            </div>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[calc(100vh-9rem)]">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 shadow-2xl aspect-video md:aspect-auto min-h-[220px] sm:min-h-[260px]">
              <div className="absolute top-4 left-4 bg-slate-900/70 text-blue-50 px-3 py-1 rounded-full text-sm border border-blue-900/50">
                You ({email})
              </div>
              {isMuted && (
                <div className="absolute top-4 right-4 bg-slate-900/70 text-blue-50 px-3 py-1 rounded-full text-xs border border-rose-500/40 flex items-center gap-2">
                  <MicOff size={14} /> Muted
                </div>
              )}
              {myStream && (
                <>
                  {!isVideoOff ? (
                    <ReactPlayer
                      playing
                      muted
                      height="100%"
                      width="100%"
                      url={myStream}
                      className="rounded-2xl"
                    />
                  ) : (
                    <div className="w-full h-full justify-center flex items-center text-blue-100">
                      <p className="text-6xl sm:text-7xl md:text-[90px] font-semibold">{email[0].toUpperCase()}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {remoteSocketId && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 shadow-2xl aspect-video md:aspect-auto min-h-[220px] sm:min-h-[260px]">
                <div className="absolute top-4 left-4 bg-slate-900/70 text-blue-50 px-3 py-1 rounded-full text-sm border border-blue-900/50">
                  {remoteEmail}
                </div>
                {remoteMuted && (
                  <div className="absolute top-4 right-4 bg-slate-900/70 text-blue-50 px-3 py-1 rounded-full text-xs border border-rose-500/40 flex items-center gap-2">
                    <MicOff size={14} /> Muted
                  </div>
                )}

                {remoteStream && (
                  <>
                    {!remoteVideoOff ? (
                      <ReactPlayer
                        playing
                        muted={false}
                        height="100%"
                        width="100%"
                        url={remoteStream}
                      />
                    ) : (
                      <div className="w-full h-full justify-center flex items-center text-blue-100">
                        <p className="text-6xl sm:text-7xl md:text-[90px] font-semibold">
                          {remoteEmail[0].toUpperCase()}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md border-t border-blue-900/40">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                className={`p-3 rounded-full border ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-100 border-rose-400/60 hover:bg-rose-500/30"
                    : "bg-slate-800/70 text-white border-slate-700 hover:bg-slate-700"
                }`}
                onClick={toggleMute}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                className={`p-3 rounded-full border ${
                  isVideoOff
                    ? "bg-rose-500/20 text-rose-100 border-rose-400/60 hover:bg-rose-500/30"
                    : "bg-slate-800/70 text-white border-slate-700 hover:bg-slate-700"
                }`}
                onClick={toggleVideo}>
                {isVideoOff ? <VideoOff size={20} /> : <Camera size={20} />}
              </button>
              <button className="p-3 rounded-full border bg-slate-800/70 text-white border-slate-700 hover:bg-slate-700">
                <Monitor size={20} onClick={showScreen} />
              </button>
              <button
                className="p-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30 disabled:opacity-50"
                onClick={handleLeaveRoom}
                disabled={!roomId}>
                <Phone size={20} className="rotate-[135deg]" />
              </button>
              <div className="hidden sm:block w-px h-6 bg-slate-600"></div>
              <button
                className="p-3 rounded-full border bg-slate-800/70 text-white border-slate-700 hover:bg-slate-700"
                onClick={() => setIsEditorOpen(!isEditorOpen)}>
                <Code size={20} />
              </button>
              <button
                className="p-3 rounded-full border bg-slate-800/70 text-white border-slate-700 hover:bg-slate-700"
                onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? (
                  <Minimize2 size={20} />
                ) : (
                  <Maximize2 size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={`${isEditorOpen ? "block" : "hidden"} w-full md:w-[40%] border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 relative h-auto md:h-full`}>
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between text-slate-100">
            <h2 className="font-semibold">Collaborative Editor</h2>
            <button
              className="p-2 hover:bg-slate-800 rounded-full"
              onClick={() => setIsEditorOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl h-[60vh] md:h-[calc(100vh-12rem)] shadow-xl overflow-hidden">
              <Editor
                roomId={roomId}
                socket={socket}
                isVisible={isEditorOpen}
                onCodeChange={(code) => {
                  codeRef.current = code;
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {showDialog && remoteEmail && (
        <Dialog
          user={remoteEmail}
          onAdmit={handleCallUser}
          onClose={() => setShowDialog(false)}
          
    
        />
      )}
    </div>
  );
};

export default RoomPage;
