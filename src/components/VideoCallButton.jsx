import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { startVideoCall } from "../utils/videoCallUtil";

export default function VideoCallButton({ 
  targetUserId, 
  targetUserName, 
  className = "",
  size = "md",
  variant = "primary" 
}) {
  const { t } = useTranslation();
  const [isCalling, setIsCalling] = useState(false);

  const handleStartCall = async () => {
    try {
      setIsCalling(true);
      await startVideoCall(targetUserId);
      // The video call manager will handle the rest
    } catch (error) {
      console.error("Error starting video call:", error);
      alert("Failed to start video call. Please try again.");
    } finally {
      setIsCalling(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
  };

  return (
    <button
      onClick={handleStartCall}
      disabled={isCalling}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-medium transition-all duration-200 
        flex items-center space-x-2 disabled:opacity-50 
        disabled:cursor-not-allowed shadow-md hover:shadow-lg
        ${className}
      `}
      title={`${t("videoCall.startVideoCall")} ${targetUserName}`}
    >
      {isCalling ? (
        <>
          <span className="animate-spin">🔄</span>
          <span>{t("videoCall.connecting")}</span>
        </>
      ) : (
        <>
          <span>📹</span>
          <span>{t("videoCall.startVideoCall")}</span>
        </>
      )}
    </button>
  );
}
