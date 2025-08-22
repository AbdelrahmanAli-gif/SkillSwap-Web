import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  answerVideoCall,
  rejectVideoCall,
  cleanupVideoCall,
} from "../utils/videoCallUtil";

export default function VideoCallNotification({ call, onCallEnded }) {
  const { t } = useTranslation();
  const [callerData, setCallerData] = useState(null);
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    if (call?.callerId) {
      // Fetch caller data
      const fetchCallerData = async () => {
        const userDoc = await getDoc(doc(db, "users", call.callerId));
        if (userDoc.exists()) {
          setCallerData({ uid: call.callerId, ...userDoc.data() });
        }
      };
      fetchCallerData();
    }
  }, [call]);

  useEffect(() => {
    // Add ringing animation effect
    const interval = setInterval(() => {
      setIsRinging(!isRinging);
    }, 500);

    return () => clearInterval(interval);
  }, [isRinging]);

  const handleAnswer = async () => {
    try {
      await answerVideoCall(call.id);
      onCallEnded?.();
    } catch (error) {
      console.error("Error answering call:", error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectVideoCall(call.id);
      onCallEnded?.();
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  if (!call || !callerData) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 ${
          isRinging ? "bg-blue-500" : "bg-blue-600"
        } text-white`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📹</span>
            <span className="font-semibold">{t("videoCall.incomingVideoCall")}</span>
          </div>
        </div>

        {/* Caller Info */}
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            {callerData.profileImage ? (
              <img 
                src={callerData.profileImage} 
                alt={callerData.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {callerData.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {callerData.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("videoCall.wantsToVideoCall")}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleAnswer}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
            >
              ✅ {t("videoCall.answer")}
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
            >
              ❌ {t("videoCall.reject")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
