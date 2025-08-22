import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./Auth/context";
import {
  initializeVideoCall,
  listenForIncomingCalls,
  cleanupVideoCall,
} from "../utils/videoCallUtil";

const VideoCallContext = createContext();

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error("useVideoCall must be used within a VideoCallProvider");
  }
  return context;
};

export const VideoCallProvider = ({ children }) => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");

  useEffect(() => {
    if (!user?.uid) return;

    // Initialize video calling
    initializeVideoCall(
      user.uid,
      (stream) => setLocalStream(stream),
      (stream) => setRemoteStream(stream),
      (status) => setCallStatus(status)
    );

    // Listen for incoming calls
    const unsubscribeIncoming = listenForIncomingCalls(user.uid, (calls) => {
      if (calls.length > 0) {
        setIncomingCall(calls[0]);
      }
    });

    return () => {
      unsubscribeIncoming();
      cleanupVideoCall();
    };
  }, [user?.uid]);

  const value = {
    incomingCall,
    setIncomingCall,
    isInVideoCall,
    setIsInVideoCall,
    localStream,
    remoteStream,
    callStatus,
    setCallStatus,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};
