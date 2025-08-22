import React from 'react';
import { useTranslation } from 'react-i18next';

const CallControls = ({ onStartVideoCall, isInCall, onDebug, onForceConnection, onCheckStreams, onRefreshRemoteStream }) => {
  const { t } = useTranslation();

  if (isInCall) {
    return null; // Don't show call controls when in a call
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={onStartVideoCall}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <span>📹</span>
        <span>{t("videoCall.startVideoCall")}</span>
      </button>
      
      {onDebug && (
        <button
          onClick={onDebug}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          <span>🐛</span>
          <span>Debug</span>
        </button>
      )}
      
      {onForceConnection && (
        <button
          onClick={onForceConnection}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
        >
          <span>⚡</span>
          <span>Force Connect</span>
        </button>
      )}

      {onRefreshRemoteStream && (
        <button
          onClick={onRefreshRemoteStream}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          <span>🔄</span>
          <span>Refresh Stream</span>
        </button>
      )}

      {onCheckStreams && (
        <button
          onClick={onCheckStreams}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
        >
          <span>📊</span>
          <span>Check Streams</span>
        </button>
      )}
    </div>
  );
};

export default CallControls;
