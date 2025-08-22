import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const VideoCall = ({ 
  localStream, 
  remoteStream, 
  onEndCall, 
  onToggleVideo, 
  onToggleAudio, 
  callStatus,
  caller // Add caller prop to show profile image
}) => {
  const { t } = useTranslation();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      try {
        localVideoRef.current.srcObject = localStream;
        console.log("Local video stream attached successfully:", {
          streamId: localStream.id,
          trackCount: localStream.getTracks().length,
          videoTracks: localStream.getVideoTracks().length,
          audioTracks: localStream.getAudioTracks().length,
          videoElement: localVideoRef.current
        });
      } catch (error) {
        console.error("Error attaching local stream:", error);
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      try {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("Remote video stream attached successfully:", {
          streamId: remoteStream.id,
          trackCount: remoteStream.getTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length,
          videoElement: remoteVideoRef.current
        });
        
        // Force video element to load and play
        remoteVideoRef.current.load();
        remoteVideoRef.current.play().catch(err => {
          console.log("Auto-play prevented, user interaction required:", err);
        });
      } catch (error) {
        console.error("Error attaching remote stream:", error);
      }
    } else if (remoteVideoRef.current && !remoteStream) {
      // Clear the video element when no remote stream
      remoteVideoRef.current.srcObject = null;
      console.log("Remote video element cleared - no stream available");
    }
  }, [remoteStream]);

  const handleToggleVideo = () => {
    onToggleVideo();
    setLocalVideoEnabled(!localVideoEnabled);
  };

  const handleToggleAudio = () => {
    onToggleAudio();
    setLocalAudioEnabled(!localAudioEnabled);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header with call status */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {t("videoCall.videoCall")}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            callStatus === 'connected' ? 'bg-green-600' : 
            callStatus === 'connecting' ? 'bg-yellow-600' : 
            callStatus === 'ringing' ? 'bg-blue-600' : 'bg-gray-600'
          }`}>
            {t(`videoCall.${callStatus}`)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Debug refresh button */}
          <button
            onClick={() => {
              if (remoteVideoRef.current && remoteStream) {
                console.log("Manually refreshing remote video element");
                remoteVideoRef.current.srcObject = null;
                setTimeout(() => {
                  if (remoteVideoRef.current && remoteStream) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    console.log("Remote stream re-attached");
                  }
                }, 100);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            title="Refresh remote video"
          >
            🔄
          </button>
          <button
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t("videoCall.endCall")}
          </button>
        </div>
      </div>

      {/* Video containers */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Remote video (main) */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
              onLoadedMetadata={() => console.log("Remote video metadata loaded")}
              onCanPlay={() => console.log("Remote video can play")}
              onError={(e) => console.error("Remote video error:", e)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                {/* Show caller's profile image if available */}
                {caller?.profileImage ? (
                  <div className="mb-4">
                    <img 
                      src={caller.profileImage} 
                      alt={caller.name || "Caller"}
                      className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-600"
                    />
                    <div className="mt-2 text-lg font-semibold">{caller.name || "Caller"}</div>
                  </div>
                ) : (
                  <div className="text-6xl mb-4">👤</div>
                )}
                <div>{t("videoCall.waitingForConnection")}</div>
                <div className="text-sm text-gray-400 mt-2">
                  {callStatus === 'connecting' ? t("videoCall.establishingConnection") : 
                   callStatus === 'ringing' ? t("videoCall.waitingForAnswer") : 
                   t("videoCall.connecting")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="w-80 bg-gray-900 rounded-lg overflow-hidden relative">
          {localStream ? (
            <div className="relative w-full h-full">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log("Local video metadata loaded")}
                onCanPlay={() => console.log("Local video can play")}
                onError={(e) => console.error("Local video error:", e)}
              />
              {/* Video/Audio status indicators */}
              <div className="absolute top-2 left-2 flex gap-2">
                {!localVideoEnabled && (
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                    📹 OFF
                  </div>
                )}
                {!localAudioEnabled && (
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                    🎤 OFF
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white text-sm">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <div>{t("videoCall.localVideo")}</div>
                <div className="text-xs text-gray-400 mt-1">Loading camera...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        <button
          onClick={handleToggleVideo}
          className={`p-3 rounded-full transition-colors ${
            localVideoEnabled 
              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={t("videoCall.toggleVideo")}
        >
          {localVideoEnabled ? '📹' : '🚫'}
        </button>
        <button
          onClick={handleToggleAudio}
          className={`p-3 rounded-full transition-colors ${
            localAudioEnabled 
              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={t("videoCall.toggleAudio")}
        >
          {localAudioEnabled ? '🎤' : '🚫'}
        </button>
      </div>

      {/* Enhanced Debug info */}
      <div className="bg-gray-900 text-white p-3 text-xs">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-semibold">Local Stream</div>
            <div>{localStream ? `${localStream.getTracks().length} tracks` : 'No stream'}</div>
            {localStream && (
              <div className="text-gray-400">
                <div>ID: {localStream.id?.substring(0, 8)}...</div>
                <div>{localStream.getTracks().map(track => track.kind).join(', ')}</div>
                <div>Active: {localStream.active ? 'Yes' : 'No'}</div>
                <div>Video Element: {localVideoRef.current ? 'Attached' : 'Not attached'}</div>
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold">Remote Stream</div>
            <div>{remoteStream ? `${remoteStream.getTracks().length} tracks` : 'No stream'}</div>
            {remoteStream && (
              <div className="text-gray-400">
                <div>ID: {remoteStream.id?.substring(0, 8)}...</div>
                <div>{remoteStream.getTracks().map(track => track.kind).join(', ')}</div>
                <div>Active: {remoteStream.active ? 'Yes' : 'No'}</div>
                <div>Video Element: {remoteVideoRef.current ? 'Attached' : 'Not attached'}</div>
                <div>srcObject: {remoteVideoRef.current?.srcObject ? 'Set' : 'Not set'}</div>
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold">Call Status</div>
            <div className="capitalize">{callStatus}</div>
            <div className="text-gray-400">
              {localVideoEnabled ? 'Video: ON' : 'Video: OFF'} | 
              {localAudioEnabled ? ' Audio: ON' : ' Audio: OFF'}
            </div>
            <div className="text-gray-400 mt-1">
              {caller?.name ? `Calling: ${caller.name}` : 'Unknown caller'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
