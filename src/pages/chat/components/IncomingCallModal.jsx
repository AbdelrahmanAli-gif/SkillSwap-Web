import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export default function IncomingCallModal({ call, onAnswer, onReject, caller }) {
  const { t } = useTranslation();
  const [callerData, setCallerData] = useState(caller);
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    if (!caller && call.callerId) {
      // Fetch caller data if not provided
      const fetchCallerData = async () => {
        const userDoc = await getDoc(doc(db, "users", call.callerId));
        if (userDoc.exists()) {
          setCallerData({ uid: call.callerId, ...userDoc.data() });
        }
      };
      fetchCallerData();
    }
  }, [call, caller]);

  useEffect(() => {
    // Add ringing animation effect
    const interval = setInterval(() => {
      setIsRinging(!isRinging);
    }, 500);

    return () => clearInterval(interval);
  }, [isRinging]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Animated ringing icon */}
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-500 ${
            isRinging 
              ? "bg-blue-500 scale-110 shadow-lg shadow-blue-500/50" 
              : "bg-blue-100 dark:bg-blue-900 scale-100"
          }`}>
            <span className="text-4xl">📹</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
            {t("videoCall.incomingVideoCall")}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            {callerData?.name || t("videoCall.unknownCaller")}
          </p>
          
          {/* Caller info */}
          {callerData && (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-center space-x-3">
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
                <div className="text-left">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {callerData.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("videoCall.wantsToVideoCall")}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onReject}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full flex items-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="mr-2 text-xl">❌</span>
              <span className="font-semibold">{t("videoCall.reject")}</span>
            </button>
            
            <button
              onClick={onAnswer}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full flex items-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="mr-2 text-xl">✅</span>
              <span className="font-semibold">{t("videoCall.answer")}</span>
            </button>
          </div>
          
          {/* Call type indicator */}
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            📹 {t("videoCall.videoCall")}
          </div>
        </div>
      </div>
    </div>
  );
}