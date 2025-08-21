import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { useAuth } from "../../contexts/Auth/context";
import { db } from "../../firebase";
import {
  getOrCreateChatRoom,
  sendMessage,
  subscribeToMessages,
} from "../../utils/chatUtil";
import UserSidebar from "./components/UserSidebar";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import dark from "../../assets/images/chat.jpg";
import light from "../../assets/images/lightchat.jpg";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../../contexts/ThemeContext.jsx";
import notificationSound from "../../assets/audio/mixkit-correct-answer-tone-2870.wav";
import {
  createVideoCall,
  subscribeToVideoCall,
  updateVideoCallStatus,
  setOffer,
  setAnswer,
  addIceCandidate,
  endVideoCall,
  updateParticipantStatus,
} from "../../utils/videoChatUtil";
import VideoCallModal from "./components/VideoCallModal";
import IncomingCallModal from "./components/IncomingCallModal.jsx";

export default function ChatScreen() {
  const { user: currentUser } = useAuth();
  const { userId: otherUserId } = useParams();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const chatImg = darkMode ? dark : light;
  const [videoCallId, setVideoCallId] = useState(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCalls, setActiveCalls] = useState([]);

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

  // Listen for incoming video calls
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Query for calls where current user is the callee and status is ringing
    const callsQuery = collection(db, "videoCalls");
    const q = query(
      callsQuery,
      where("calleeId", "==", currentUser.uid),
      where("status", "in", ["ringing", "in-progress"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const calls = [];
      snapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() });
      });

      setActiveCalls(calls);

      // Check for ringing calls
      const ringingCall = calls.find((call) => call.status === "ringing");
      if (ringingCall) {
        setIncomingCall(ringingCall);
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
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

  const handleStartVideoCall = async () => {
    try {
      const callId = await createVideoCall(
        chatId,
        currentUser.uid,
        otherUser.uid
      );
      setVideoCallId(callId);
      setIsVideoCallActive(true);

      // Update status to ringing
      await updateVideoCallStatus(callId, "ringing");
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const handleAnswerCall = async (callId) => {
    setVideoCallId(callId);
    setIsVideoCallActive(true);
    setIncomingCall(null);
    await updateVideoCallStatus(callId, "in-progress");
    await updateParticipantStatus(callId, currentUser.uid, { joined: true });
  };

  const handleRejectCall = async (callId) => {
    await updateVideoCallStatus(callId, "ended");
    setIncomingCall(null);
  };

  const handleEndVideoCall = async () => {
    if (videoCallId) {
      await endVideoCall(videoCallId);
    }
    setVideoCallId(null);
    setIsVideoCallActive(false);
  };

  const handleSend = (text) => {
    if (chatId) sendMessage(chatId, currentUser.uid, text);
  };

  if (!currentUser) return <div>Loading current user...</div>;
  if (!otherUser) return <div>Loading chat partner...</div>;

  return (
    <div className="w-full chat-box overflow-y-scroll  ">
      <div className="flex h-[100vh] bg-black backdrop-blur-xl  shadow-xl overflow-hidden">
        <div
          className="flex-1 flex flex-col px-5 overflow-hidden"
          style={{ backgroundImage: `url(${chatImg})`, backgroundSize: "cover" }}
        >
          {/* Header */}
          <div className="dark:bg-[var(--input-bg)] bg-[var(--input-bg)] px-5 -mx-5 py-4 border-b border-gray-900">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold dark:text-gray-300 text-[var(--color-text-primary)]">
                {t("chat.chat")} {otherUser.name}
              </h1>
              <button
                onClick={handleStartVideoCall}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition"
                title={t("videoCall.start")}
              >
                <span>📹</span>
                <span className="hidden sm:inline">{t("videoCall.start")}</span>
              </button>
              <button
                onClick={() => navigate("/messages")}
                className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-light)] rounded-md shadow-sm  hover:bg-[var(--color-btn-back-hover)] transition"
              >
                <span>🔙</span>
                <span className="text-[var(--color-text-primary)] dark:text-gray-300">
                  {" "}
                  {t("chat.Back")}
                </span>
              </button>
            </div>
          </div>

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
        {isVideoCallActive && (
          <VideoCallModal
            callId={videoCallId}
            currentUser={currentUser}
            otherUser={otherUser}
            onEndCall={handleEndVideoCall}
          />
        )}
        {incomingCall && (
          <IncomingCallModal
            call={incomingCall}
            onAnswer={() => handleAnswerCall(incomingCall.id)}
            onReject={() => handleRejectCall(incomingCall.id)}
            caller={otherUser}
          />
        )}
      </div>
    </div>
  );
}