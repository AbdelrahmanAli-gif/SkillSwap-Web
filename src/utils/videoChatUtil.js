import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase";

// Create a video call session
export const createVideoCall = async (chatId, callerId, calleeId) => {
  const callId = `${chatId}_${Date.now()}`;
  const callRef = doc(db, "videoCalls", callId);
  
  await setDoc(callRef, {
    chatId,
    callId,
    callerId,
    calleeId,
    status: "ringing", // initiated, ringing, in-progress, ended
    createdAt: new Date(),
    participants: {
      [callerId]: { joined: false },
      [calleeId]: { joined: false }
    },
    offer: null,
    answer: null,
    iceCandidates: {}
  });
  
  return callId;
};

// Subscribe to video call updates
export const subscribeToVideoCall = (callId, callback) => {
  const callRef = doc(db, "videoCalls", callId);
  
  return onSnapshot(callRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
};

// Update video call status
export const updateVideoCallStatus = async (callId, status) => {
  const callRef = doc(db, "videoCalls", callId);
  await updateDoc(callRef, { status });
};

// Update participant status
export const updateParticipantStatus = async (callId, userId, status) => {
  const callRef = doc(db, "videoCalls", callId);
  await updateDoc(callRef, {
    [`participants.${userId}`]: status
  });
};

// Set offer in the call document
export const setOffer = async (callId, offer) => {
  const callRef = doc(db, "videoCalls", callId);
  await updateDoc(callRef, { offer });
};

// Set answer in the call document
export const setAnswer = async (callId, answer) => {
  const callRef = doc(db, "videoCalls", callId);
  await updateDoc(callRef, { answer });
};

// Add ICE candidate to the call document
export const addIceCandidate = async (callId, userId, candidate) => {
  const callRef = doc(db, "videoCalls", callId);
  await updateDoc(callRef, {
    [`iceCandidates.${userId}`]: candidate
  });
};

// End video call
export const endVideoCall = async (callId) => {
  const callRef = doc(db, "videoCalls", callId);
  await updateDoc(callRef, { status: "ended" });
  
  // Optionally delete the call document after a delay
  setTimeout(() => {
    deleteDoc(callRef).catch(() => {});
  }, 60000); // Delete after 1 minute
};