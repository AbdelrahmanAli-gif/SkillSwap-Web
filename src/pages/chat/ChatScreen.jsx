import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/Auth/context";
import { db } from "../../firebase";
import {
  getOrCreateChatRoom,
  sendMessage,
  subscribeToMessages,
} from "../../utils/chatUtil";
import {
  initializeVideoCall,
  startVideoCall,
  answerVideoCall,
  endVideoCall,
  rejectVideoCall,
  toggleVideo,
  toggleAudio,
  listenForIncomingCalls,
  cleanupVideoCall,
  debugVideoCall,
  forceVideoCallConnection,
  refreshRemoteStream,
} from "../../utils/videoCallUtil";
import UserSidebar from "./components/UserSidebar";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import CallControls from "./components/CallControls";
import VideoCall from "./components/VideoCall";
import IncomingCallModal from "./components/IncomingCallModal";
import dark from "../../assets/images/chat.jpg";
import light from "../../assets/images/lightchat.jpg";
import { useTranslation } from "react-i18next";
import {ThemeContext} from"../../contexts/ThemeContext.jsx";
import notificationSound from "../../assets/audio/mixkit-correct-answer-tone-2870.wav"

export default function ChatScreen() {
  const { user: currentUser } = useAuth();
  const { userId: otherUserId } = useParams();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const { t }= useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const chatImg = darkMode ? dark : light;

  // Video calling state
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [incomingCall, setIncomingCall] = useState(null);


  const navigate = useNavigate();

  useEffect(() => {
    if (!otherUserId) return;
    getDoc(doc(db, "users", otherUserId)).then((snap) => {
      if (snap.exists()) setOtherUser({ uid: otherUserId, ...snap.data() });
    });
  }, [otherUserId]);

  useEffect(() => {
    if (!currentUser?.uid || !otherUser?.uid) return;

    const init = async () => {
      const id = await getOrCreateChatRoom(currentUser.uid, otherUser.uid);
      setChatId(id);
      const unsub = subscribeToMessages(id, setMessages);
      return () => unsub();
    };
    init();
  }, [currentUser, otherUser]);

  // Initialize video calling
  useEffect(() => {
    if (!currentUser?.uid) return;

    initializeVideoCall(
      currentUser.uid,
      (stream) => {
        console.log("Local stream received:", stream?.getTracks().map(t => t.kind));
        console.log("Local stream details:", {
          id: stream?.id,
          active: stream?.active,
          trackCount: stream?.getTracks().length,
          videoTracks: stream?.getVideoTracks().length,
          audioTracks: stream?.getAudioTracks().length
        });
        setLocalStream(stream);
      },
      (stream) => {
        console.log("Remote stream received:", stream?.getTracks().map(t => t.kind));
        console.log("Remote stream details:", {
          id: stream?.id,
          active: stream?.active,
          trackCount: stream?.getTracks().length,
          videoTracks: stream?.getVideoTracks().length,
          audioTracks: stream?.getAudioTracks().length
        });
        setRemoteStream(stream);
      },
      (status) => {
        console.log("Call status changed:", status);
        setCallStatus(status);
        
        // Handle call state transitions
        if (status === "connected") {
          // Call is connected, ensure we're in video call mode
          console.log("Call connected, setting video call state");
          setIsInVideoCall(true);
        } else if (status === "ended" || status === "failed") {
          // Call ended or failed, reset state
          console.log("Call ended/failed, resetting state");
          setIsInVideoCall(false);
          setLocalStream(null);
          setRemoteStream(null);
          setIncomingCall(null);
        } else if (status === "ringing") {
          console.log("Call ringing, waiting for answer");
        } else if (status === "connecting") {
          console.log("Call connecting, establishing WebRTC connection");
        }
      }
    );

    // Listen for incoming calls
    const unsubscribeIncoming = listenForIncomingCalls(currentUser.uid, (calls) => {
      console.log("Incoming calls received:", calls);
      if (calls.length > 0) {
        setIncomingCall(calls[0]);
      } else {
        setIncomingCall(null);
      }
    });

    return () => {
      unsubscribeIncoming();
      cleanupVideoCall();
    };
  }, [currentUser?.uid]);


useEffect(() => {
  if (!chatId || !currentUser?.uid) return;

  const markLastMessageAsRead = async () => {
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data();
    const lastMsg = chatData?.lastMessage;

    if (lastMsg && !lastMsg.readBy?.includes(currentUser.uid)) {
      await updateDoc(chatRef, {
        "lastMessage.readBy": [...(lastMsg.readBy || []), currentUser.uid],
      });
    }
  };

  markLastMessageAsRead();
}, [chatId, currentUser?.uid]);

useEffect(() => {
  if (!currentUser?.uid || !otherUser?.uid) return;

  const init = async () => {
    const id = await getOrCreateChatRoom(currentUser.uid, otherUser.uid);
    setChatId(id);

    let prevMessages = [];
    const unsub = subscribeToMessages(id, (msgs) => {
      // detect new message
      if (prevMessages.length && msgs.length > prevMessages.length) {
        const newMsg = msgs[msgs.length - 1];

        if (
          newMsg.senderId !== currentUser.uid && 
          document.visibilityState !== "visible"
        ) {
          const audio = new Audio(notificationSound);
          audio.play().catch((err) => console.log("Sound blocked:", err));
        }
      }

      prevMessages = msgs;
      setMessages(msgs);
    });

    return () => unsub();
  };

  init();
}, [currentUser, otherUser]);






  const handleSend = (text) => {
    if (chatId) sendMessage(chatId, currentUser.uid, text);
  };

  // Video calling handlers
  const handleStartVideoCall = async () => {
    try {
      // Prevent calling yourself
      if (currentUser.uid === otherUser.uid) {
        alert("You cannot call yourself!");
        return;
      }

      console.log("Starting video call to:", otherUser.uid);
      setIsInVideoCall(true);
      setCallStatus("ringing");
      await startVideoCall(otherUser.uid);
      console.log("Video call started successfully");
    } catch (error) {
      console.error("Error starting video call:", error);
      setIsInVideoCall(false);
      setCallStatus("idle");
      
      // Show user-friendly error message
      if (error.message === "Cannot call yourself") {
        alert("You cannot call yourself!");
      } else if (error.name === 'NotReadableError') {
        alert("Camera or microphone is already in use. Please close other video applications and try again.");
      } else if (error.name === 'NotAllowedError') {
        alert("Camera or microphone access was denied. Please allow access and try again.");
      } else {
        alert("Failed to start video call. Please try again.");
      }
    }
  };

  const handleAnswerCall = async () => {
    try {
      console.log("Answering call:", incomingCall);
      
      // Set call state first
      setIsInVideoCall(true);
      setCallStatus("connecting");
      
      // Clear incoming call modal after a short delay to prevent flickering
      setTimeout(() => {
        setIncomingCall(null);
      }, 100);
      
      await answerVideoCall(incomingCall.id);
      console.log("Call answered successfully");
    } catch (error) {
      console.error("Error answering call:", error);
      setIsInVideoCall(false);
      setCallStatus("idle");
      
      // Provide specific error messages
      if (error.name === 'NotReadableError') {
        alert("Camera or microphone is already in use. Please close other video applications and try again.");
      } else if (error.name === 'NotAllowedError') {
        alert("Camera or microphone access was denied. Please allow access and try again.");
      } else {
        alert("Failed to answer call. Please try again.");
      }
    }
  };

  const handleRejectCall = async () => {
    try {
      await rejectVideoCall(incomingCall.id);
      setIncomingCall(null);
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  const handleEndCall = async () => {
    try {
      console.log("Ending video call");
      await endVideoCall();
      console.log("Video call ended successfully");
      setIsInVideoCall(false);
      setCallStatus("idle");
      setLocalStream(null);
      setRemoteStream(null);
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleDebug = () => {
    debugVideoCall();
  };

  const handleForceConnection = () => {
    forceVideoCallConnection();
  };

  const handleRefreshRemoteStream = () => {
    refreshRemoteStream();
  };

  const checkStreamStates = () => {
    console.log("=== Current Stream States ===");
    console.log("Local Stream:", {
      exists: !!localStream,
      active: localStream?.active,
      trackCount: localStream?.getTracks().length,
      videoTracks: localStream?.getVideoTracks().length,
      audioTracks: localStream?.getAudioTracks().length,
      videoEnabled: localStream?.getVideoTracks()[0]?.enabled,
      audioEnabled: localStream?.getAudioTracks()[0]?.enabled
    });
    console.log("Remote Stream:", {
      exists: !!remoteStream,
      active: remoteStream?.active,
      trackCount: remoteStream?.getTracks().length,
      videoTracks: remoteStream?.getVideoTracks().length,
      audioTracks: remoteStream?.getAudioTracks().length
    });
    console.log("Call State:", {
      isInVideoCall,
      callStatus,
      hasIncomingCall: !!incomingCall
    });
    console.log("=============================");
  };

  if (!currentUser) return <div>Loading current user...</div>;
  if (!otherUser) return <div>Loading chat partner...</div>;

  return (
    <>
      {/* Video Call Interface */}
      {isInVideoCall && (
        <VideoCall
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={handleEndCall}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          callStatus={callStatus}
          caller={otherUser} // Pass the other user as caller to show their profile image
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && incomingCall.callerId !== currentUser.uid && (
        <IncomingCallModal
          call={incomingCall}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
          caller={otherUser}
        />
      )}

      {/* Main Chat Interface */}
      <div className="w-full chat-box overflow-y-scroll">
        <div className="flex h-[100vh] bg-black backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="flex-1 flex flex-col px-5 overflow-hidden"
                  style={{ backgroundImage: `url(${chatImg})`, backgroundSize: "cover" }}>

            {/* Header */}
            <div className="dark:bg-[var(--input-bg)] bg-[var(--input-bg)] px-5 -mx-5 py-4 border-b border-gray-900">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold dark:text-gray-300 text-[var(--color-text-primary)]">
                  {t("chat.chat")} {otherUser.name}
                </h1>
                <button
                  onClick={() => navigate("/messages")}
                  className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-light)] rounded-md shadow-sm hover:bg-[var(--color-btn-back-hover)] transition"
                >
                  <span>🔙</span>
                  <span className="text-[var(--color-text-primary)] dark:text-gray-300"> {t("chat.Back")}</span>
                </button>
              </div>
            </div>

            {/* Call Controls */}
            <CallControls 
              onStartVideoCall={handleStartVideoCall}
              isInCall={isInVideoCall}
              onDebug={handleDebug}
              onForceConnection={handleForceConnection}
              onCheckStreams={checkStreamStates}
              onRefreshRemoteStream={handleRefreshRemoteStream}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 px-2 custom-scrollbar py-7">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isCurrentUser={msg.senderId === currentUser.uid}
                  otherUserName={otherUser.name}
                />
              ))}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} />
          </div>

          {/* Sidebar */}
          <UserSidebar user={otherUser} />
        </div>
      </div>
    </>
  );
}
