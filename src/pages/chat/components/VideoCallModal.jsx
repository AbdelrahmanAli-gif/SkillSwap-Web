import { useState, useEffect, useRef, useContext } from "react";
import { useTranslation } from "react-i18next";
import { WebRTCManager } from "../../../utils/webRTCUtil";
import {
  subscribeToVideoCall,
  updateVideoCallStatus,
  updateParticipantStatus,
  endVideoCall,
  setOffer,
  setAnswer,
  addIceCandidate,
} from "../../../utils/videoChatUtil";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export default function VideoCallModal({
  callId,
  currentUser,
  otherUser,
  onEndCall,
}) {
  const { t } = useTranslation();
  const [callStatus, setCallStatus] = useState("connecting");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [permissionState, setPermissionState] = useState("prompt"); // prompt, granted, denied

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcManager = useRef(null);
  const callUnsubscribe = useRef(null);
  const isCallerRef = useRef(false);

  // Check camera and microphone permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput' && device.deviceId !== '');
        const hasMicrophone = devices.some(device => device.kind === 'audioinput' && device.deviceId !== '');
        
        if (!hasCamera && !hasMicrophone) {
          setPermissionState("denied");
          setConnectionError("Camera and microphone access is blocked. Please check your browser permissions.");
        } else if (!hasCamera) {
          setPermissionState("denied");
          setConnectionError("Camera access is blocked. Please check your browser permissions.");
        } else if (!hasMicrophone) {
          setPermissionState("denied");
          setConnectionError("Microphone access is blocked. Please check your browser permissions.");
        } else {
          setPermissionState("granted");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setPermissionState("denied");
        setConnectionError("Cannot access media devices. Please check your browser permissions.");
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    if (!callId || permissionState === "denied") return;

    const initCall = async () => {
      try {
        webrtcManager.current = new WebRTCManager();

        // Get local media stream with error handling
        let localStream;
        try {
          localStream = await webrtcManager.current.startLocalMedia();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          setPermissionState("granted");
        } catch (error) {
          console.error("Error accessing media devices:", error);
          setPermissionState("denied");
          
          if (error.name === "NotAllowedError") {
            setConnectionError("Camera and microphone access was denied. Please allow permissions to start the video call.");
          } else if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
            setConnectionError("Required camera or microphone not found. Please check your device connections.");
          } else {
            setConnectionError("Failed to access camera and microphone. Please check your device permissions.");
          }
          return;
        }

        // Set up remote stream handler
        webrtcManager.current.onRemoteStream = (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setCallStatus("connected");
        };

        // Set up ICE candidate handler
        webrtcManager.current.onIceCandidate = (candidate) => {
          addIceCandidate(callId, currentUser.uid, candidate);
        };

        // Set up connection state change handler
        webrtcManager.current.peerConnection.onconnectionstatechange = () => {
          console.log("Connection state:", webrtcManager.current.peerConnection.connectionState);
          if (webrtcManager.current.peerConnection.connectionState === "connected") {
            setCallStatus("connected");
            setConnectionError(null);
          } else if (webrtcManager.current.peerConnection.connectionState === "disconnected" ||
                     webrtcManager.current.peerConnection.connectionState === "failed") {
            setConnectionError("Connection failed. Please try again.");
          }
        };

        // Set up ICE connection state change handler
        webrtcManager.current.peerConnection.oniceconnectionstatechange = () => {
          console.log("ICE connection state:", webrtcManager.current.peerConnection.iceConnectionState);
          if (webrtcManager.current.peerConnection.iceConnectionState === "failed") {
            setConnectionError("Connection failed. Please try again.");
          }
        };

        // Subscribe to call updates
        callUnsubscribe.current = subscribeToVideoCall(
          callId,
          async (callData) => {
            if (!callData) {
              setConnectionError("Call not found");
              return;
            }

            setCallStatus(callData.status);

            if (callData.status === "ended") {
              handleEndCall();
              return;
            }

            // Determine if we are the caller
            isCallerRef.current = callData.callerId === currentUser.uid;

            // Handle WebRTC signaling
            if (callData.offer && !webrtcManager.current.peerConnection.remoteDescription) {
              // We are the callee, create answer
              try {
                const answer = await webrtcManager.current.createAnswer(callData.offer);
                await setAnswer(callId, answer);
                await updateVideoCallStatus(callId, "in-progress");
                setCallStatus("in-progress");
              } catch (error) {
                console.error("Error creating answer:", error);
                setConnectionError("Failed to establish connection");
              }
            } else if (
              callData.answer &&
              isCallerRef.current &&
              !webrtcManager.current.peerConnection.remoteDescription
            ) {
              // We are the caller, set remote answer
              try {
                await webrtcManager.current.setRemoteDescription(callData.answer);
                setCallStatus("in-progress");
              } catch (error) {
                console.error("Error setting remote description:", error);
                setConnectionError("Failed to establish connection");
              }
            }

            // Handle ICE candidates
            if (callData.iceCandidates) {
              for (const [userId, candidate] of Object.entries(
                callData.iceCandidates
              )) {
                if (userId !== currentUser.uid && candidate) {
                  try {
                    await webrtcManager.current.addIceCandidate(candidate);
                  } catch (error) {
                    console.error("Error adding ICE candidate:", error);
                  }
                }
              }
            }
          }
        );

        // Check if we need to create an offer (we are the caller)
        try {
          const callDoc = await getDoc(doc(db, "videoCalls", callId));
          if (callDoc.exists()) {
            const callData = callDoc.data();
            if (
              callData.callerId === currentUser.uid &&
              callData.status === "ringing" &&
              !callData.offer
            ) {
              // We are the caller, create offer
              const offer = await webrtcManager.current.createOffer();
              await setOffer(callId, offer);
              setCallStatus("ringing");
            }
          }
        } catch (error) {
          console.error("Error checking call data:", error);
          setConnectionError("Failed to initialize call");
        }

        // Update participant status
        await updateParticipantStatus(callId, currentUser.uid, {
          joined: true,
        });
      } catch (error) {
        console.error("Error initializing call:", error);
        setConnectionError("Failed to initialize call. Please check your camera and microphone permissions.");
      }
    };

    initCall();

    return () => {
      if (callUnsubscribe.current) {
        callUnsubscribe.current();
      }
      if (webrtcManager.current) {
        webrtcManager.current.close();
      }
    };
  }, [callId, currentUser.uid, permissionState]);

  const handleToggleVideo = () => {
    if (webrtcManager.current && webrtcManager.current.localStream) {
      const videoTracks = webrtcManager.current.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleToggleAudio = () => {
    if (webrtcManager.current && webrtcManager.current.localStream) {
      const audioTracks = webrtcManager.current.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleEndCall = async () => {
    if (webrtcManager.current) {
      webrtcManager.current.close();
    }
    if (callId) {
      await endVideoCall(callId);
    }
    onEndCall();
  };

  const retryConnection = async () => {
    setConnectionError(null);
    setCallStatus("connecting");
    
    if (webrtcManager.current) {
      webrtcManager.current.close();
    }
    
    // Reinitialize the call
    try {
      webrtcManager.current = new WebRTCManager();

      // Get local media stream
      const localStream = await webrtcManager.current.startLocalMedia();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Set up remote stream handler
      webrtcManager.current.onRemoteStream = (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setCallStatus("connected");
      };

      // Set up ICE candidate handler
      webrtcManager.current.onIceCandidate = (candidate) => {
        addIceCandidate(callId, currentUser.uid, candidate);
      };

      // Create a new offer if we were the caller
      if (isCallerRef.current) {
        const offer = await webrtcManager.current.createOffer();
        await setOffer(callId, offer);
        setCallStatus("ringing");
      }
    } catch (error) {
      console.error("Error retrying connection:", error);
      setConnectionError("Failed to reconnect. Please try again.");
    }
  };

  const requestPermissions = async () => {
    try {
      // Try to get media stream to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Update state
      setPermissionState("granted");
      setConnectionError(null);
      
      // Retry connection
      retryConnection();
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setConnectionError("Failed to get camera/microphone access. Please check your browser settings.");
    }
  };

  const openSettings = () => {
    // Provide guidance based on browser
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = typeof InstallTrigger !== 'undefined';
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    
    let instructions = "";
    
    if (isChrome) {
      instructions = "Click the camera icon in the address bar and set Camera and Microphone to 'Allow'.";
    } else if (isFirefox) {
      instructions = "Go to Preferences > Privacy & Security > Permissions > Camera and Microphone and allow this site.";
    } else if (isSafari) {
      instructions = "Go to Safari > Preferences > Websites > Camera and Microphone and allow this site.";
    } else {
      instructions = "Please check your browser settings to allow camera and microphone access for this site.";
    }
    
    setConnectionError(`Permissions denied. ${instructions}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-6xl mx-auto flex flex-col">
        {/* Remote Video */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {(callStatus === "ringing" || callStatus === "connecting") && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-4xl">📞</span>
                </div>
                <div className="text-white text-2xl mb-2">
                  {callStatus === "ringing" 
                    ? t("videoCall.ringing") 
                    : t("videoCall.connecting")}
                </div>
                <p className="text-gray-300">
                  {callStatus === "ringing" 
                    ? t("videoCall.waitingForAnswer") 
                    : t("videoCall.establishingConnection")}
                </p>
              </div>
            </div>
          )}
          
          {connectionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md mx-4">
                <div className="text-red-500 text-4xl mb-4">❌</div>
                <h3 className="text-white text-xl font-semibold mb-2">
                  {t("videoCall.connectionError")}
                </h3>
                <p className="text-gray-300 mb-6">{connectionError}</p>
                <div className="flex flex-col space-y-3 justify-center">
                  {permissionState === "denied" ? (
                    <>
                      <button
                        onClick={requestPermissions}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {t("videoCall.grantPermissions")}
                      </button>
                      <button
                        onClick={openSettings}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        {t("videoCall.openSettings")}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={retryConnection}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t("videoCall.retry")}
                    </button>
                  )}
                  <button
                    onClick={handleEndCall}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {t("videoCall.endCall")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video - Only show if permissions are granted */}
        {permissionState === "granted" && (
          <div className="absolute bottom-4 right-4 w-1/4 max-w-xs rounded-lg overflow-hidden shadow-lg border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call Controls - Only show if permissions are granted */}
        {permissionState === "granted" && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <button
              onClick={handleToggleAudio}
              className={`p-4 rounded-full text-xl ${
                isAudioEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
              } text-white transition-all duration-200 transform hover:scale-110`}
              title={isAudioEnabled ? t("videoCall.mute") : t("videoCall.unmute")}
            >
              {isAudioEnabled ? "🎤" : "🔇"}
            </button>

            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl transition-all duration-200 transform hover:scale-110"
              title={t("videoCall.endCall")}
            >
              📞
            </button>

            <button
              onClick={handleToggleVideo}
              className={`p-4 rounded-full text-xl ${
                isVideoEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
              } text-white transition-all duration-200 transform hover:scale-110`}
              title={isVideoEnabled ? t("videoCall.turnOffVideo") : t("videoCall.turnOnVideo")}
            >
              {isVideoEnabled ? "📹" : "📷"}
            </button>
          </div>
        )}

        {/* Call Status */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
          {t(`videoCall.status.${callStatus}`)}
        </div>

        {/* Caller Info */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
          {t("videoCall.with")} {otherUser?.name}
        </div>
      </div>
    </div>
  );
}