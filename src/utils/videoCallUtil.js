import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// WebRTC configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

class VideoCallManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.currentCallId = null;
    this.currentUserId = null;
    this.otherUserId = null;
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onCallStateChange = null;
    this.onIceCandidate = null;
    this.pendingIceCandidates = []; // New property to store pending candidates
    this.iceCandidateUnsubscribe = null; // New property to store unsubscribe function
  }

  // Initialize the video call manager
  initialize(userId, onLocalStream, onRemoteStream, onCallStateChange) {
    this.currentUserId = userId;
    this.onLocalStream = onLocalStream;
    this.onRemoteStream = onRemoteStream;
    this.onCallStateChange = onCallStateChange;
  }

  // Start a video call
  async startCall(otherUserId) {
    try {
      // Prevent self-calling
      if (otherUserId === this.currentUserId) {
        throw new Error("Cannot call yourself");
      }

      this.otherUserId = otherUserId;
      const callId = this.generateCallId();
      this.currentCallId = callId;

      // Create call document in Firebase
      await setDoc(doc(db, "calls", callId), {
        callerId: this.currentUserId,
        receiverId: otherUserId,
        status: "ringing",
        createdAt: serverTimestamp(),
        offer: null,
        answer: null,
        iceCandidates: {},
      });

      // Only get user media if we don't already have it
      if (!this.localStream) {
        await this.getUserMedia();
      }
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("Local description set for offer");
      
      await updateDoc(doc(db, "calls", callId), {
        offer: offer,
        status: "ringing"
      });
      console.log("Offer sent to receiver");

      // Listen for answer
      this.listenForAnswer(callId);
      
      // Listen for ICE candidates
      this.listenForIceCandidates(callId);
      
      this.onCallStateChange?.("ringing");
      
      return callId;
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  }

  // Answer an incoming call
  async answerCall(callId) {
    try {
      this.currentCallId = callId;
      
      // Only get user media if we don't already have it
      if (!this.localStream) {
        await this.getUserMedia();
      }
      
      // Create peer connection
      this.createPeerConnection();
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Listen for offer
      const unsubscribe = onSnapshot(doc(db, "calls", callId), async (docSnapshot) => {
        const callData = docSnapshot.data();
        if (callData?.offer && !this.peerConnection.remoteDescription) {
          try {
            console.log("Processing offer from caller");
            await this.peerConnection.setRemoteDescription(callData.offer);
            console.log("Remote description set successfully");
            
            // Create and send answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log("Local description set successfully");
            
            await updateDoc(doc(db, "calls", callId), {
              answer: answer,
              status: "connected"
            });
            console.log("Answer sent to caller");

            // Now that we have both descriptions, process any pending ICE candidates
            this.processPendingIceCandidates();
            
            unsubscribe();
          } catch (error) {
            console.error("Error processing offer:", error);
            // If there's an error, try to clean up
            this.cleanup();
            this.onCallStateChange?.("failed");
          }
        }
      });

      // Listen for ICE candidates
      this.listenForIceCandidates(callId);
      
    } catch (error) {
      console.error("Error answering call:", error);
      // Clean up on error
      this.cleanup();
      throw error;
    }
  }

  // End the current call
  async endCall() {
    try {
      if (this.currentCallId) {
        await updateDoc(doc(db, "calls", this.currentCallId), {
          status: "ended",
          endedAt: serverTimestamp()
        });
      }
      
      this.cleanup();
      this.onCallStateChange?.("ended");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }

  // Reject an incoming call
  async rejectCall(callId) {
    try {
      await updateDoc(doc(db, "calls", callId), {
        status: "rejected",
        rejectedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  }

  // Get user media (camera and microphone)
  async getUserMedia() {
    try {
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported");
      }

      // Check if we already have a stream
      if (this.localStream) {
        console.log("Using existing media stream");
        return;
      }

      console.log("Requesting media access...");
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log("Media access granted:", this.localStream.getTracks().map(t => t.kind));
      console.log("Local stream details:", {
        id: this.localStream.id,
        active: this.localStream.active,
        trackCount: this.localStream.getTracks().length,
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length
      });
      this.onLocalStream?.(this.localStream);
    } catch (error) {
      console.error("Error getting user media:", error);
      
      // If device is in use, try to get audio only
      if (error.name === 'NotReadableError' || error.name === 'NotAllowedError') {
        try {
          console.log("Trying audio only...");
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          console.log("Audio access granted");
          this.onLocalStream?.(this.localStream);
          return;
        } catch (audioError) {
          console.error("Audio only also failed:", audioError);
        }
      }
      
      throw error;
    }
  }

  // Create WebRTC peer connection
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      console.log("Track details:", {
        id: event.track.id,
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        streamId: event.streams[0]?.id,
        streamsCount: event.streams?.length || 0
      });
      
      // Handle the case where event.streams might be empty
      if (event.streams && event.streams.length > 0) {
        this.remoteStream = event.streams[0];
        console.log("Remote stream set from streams array:", {
          id: this.remoteStream?.id,
          active: this.remoteStream?.active,
          trackCount: this.remoteStream?.getTracks().length
        });
      } else {
        // If no streams array, create a new MediaStream with the track
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
        console.log("Remote stream created/updated with track:", {
          id: this.remoteStream?.id,
          active: this.remoteStream?.active,
          trackCount: this.remoteStream?.getTracks().length,
          addedTrack: event.track.kind
        });
      }
      
      // Notify the UI about the remote stream
      this.onRemoteStream?.(this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate:", {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        });
        this.sendIceCandidate(event.candidate);
      } else {
        console.log("ICE candidate generation complete");
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection state changed:", this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === "connected") {
        console.log("WebRTC connection established successfully!");
        this.onCallStateChange?.("connected");
      } else if (this.peerConnection.connectionState === "disconnected") {
        console.log("WebRTC connection disconnected");
        this.onCallStateChange?.("disconnected");
      } else if (this.peerConnection.connectionState === "failed") {
        console.log("WebRTC connection failed");
        this.onCallStateChange?.("failed");
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.peerConnection.iceConnectionState);
      
      if (this.peerConnection.iceConnectionState === "connected") {
        console.log("ICE connection established!");
        // Update call status to connected when ICE connection is established
        if (this.currentCallId) {
          updateDoc(doc(db, "calls", this.currentCallId), {
            status: "connected"
          }).catch(error => {
            console.error("Error updating call status:", error);
          });
        }
      } else if (this.peerConnection.iceConnectionState === "failed") {
        console.log("ICE connection failed");
        this.onCallStateChange?.("failed");
      }
    };
    
    // Handle signaling state changes
    this.peerConnection.onsignalingstatechange = () => {
      console.log("Signaling state:", this.peerConnection.signalingState);
      
      // If signaling is stable and we have both descriptions, try to establish connection
      if (this.peerConnection.signalingState === "stable" && 
          this.peerConnection.remoteDescription && 
          this.peerConnection.localDescription) {
        console.log("Signaling stable, processing pending ICE candidates");
        this.processPendingIceCandidates();
      }
    };
  }

  // Listen for answer from receiver
  listenForAnswer(callId) {
    const unsubscribe = onSnapshot(doc(db, "calls", callId), async (docSnapshot) => {
      const callData = docSnapshot.data();
      if (callData?.answer && !this.peerConnection.remoteDescription) {
        try {
          console.log("Processing answer from receiver");
          await this.peerConnection.setRemoteDescription(callData.answer);
          console.log("Remote description set successfully");
          
          // Now that we have both descriptions, process any pending ICE candidates
          this.processPendingIceCandidates();
          
          unsubscribe();
        } catch (error) {
          console.error("Error processing answer:", error);
          this.cleanup();
          this.onCallStateChange?.("failed");
        }
      }
    });
  }

  // Listen for ICE candidates
  listenForIceCandidates(callId) {
    // Store pending candidates until we have both descriptions
    this.pendingIceCandidates = [];
    
    const unsubscribe = onSnapshot(doc(db, "calls", callId), async (docSnapshot) => {
      const callData = docSnapshot.data();
      if (callData?.iceCandidates && this.peerConnection) {
        // Find the other user's ID from the call data
        const otherUserId = callData.callerId === this.currentUserId ? callData.receiverId : callData.callerId;
        const candidates = callData.iceCandidates[otherUserId] || [];
        
        console.log(`Received ${candidates.length} ICE candidates from user ${otherUserId}:`, candidates);
        
        for (const candidateData of candidates) {
          try {
            // Reconstruct RTCIceCandidate from serialized data
            const candidate = new RTCIceCandidate({
              candidate: candidateData.candidate,
              sdpMLineIndex: candidateData.sdpMLineIndex,
              sdpMid: candidateData.sdpMid
            });
            
            // If we don't have both descriptions yet, store the candidate
            if (!this.peerConnection.remoteDescription || !this.peerConnection.localDescription) {
              console.log("Storing pending ICE candidate - descriptions not ready yet");
              this.pendingIceCandidates.push(candidate);
              continue;
            }
            
            console.log("Adding ICE candidate:", {
              candidate: candidate.candidate,
              sdpMLineIndex: candidate.sdpMLineIndex,
              sdpMid: candidate.sdpMid
            });
            
            await this.peerConnection.addIceCandidate(candidate);
            console.log("ICE candidate added successfully");
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        }
      }
    });
    
    // Store unsubscribe function for cleanup
    this.iceCandidateUnsubscribe = unsubscribe;
  }

  // Process any pending ICE candidates
  processPendingIceCandidates() {
    if (!this.pendingIceCandidates || this.pendingIceCandidates.length === 0) {
      console.log("No pending ICE candidates to process");
      return;
    }
    
    console.log(`Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
    
    this.pendingIceCandidates.forEach(async (candidate) => {
      try {
        await this.peerConnection.addIceCandidate(candidate);
        console.log("Pending ICE candidate added successfully");
      } catch (error) {
        console.error("Error adding pending ICE candidate:", error);
      }
    });
    
    this.pendingIceCandidates = [];
    
    // Check connection state after processing candidates
    console.log("Connection state after processing ICE candidates:", {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      signalingState: this.peerConnection.signalingState
    });
  }

  // Send ICE candidate
  async sendIceCandidate(candidate) {
    if (!this.currentCallId) return;
    
    try {
      // Extract only serializable properties from RTCIceCandidate
      const serializedCandidate = {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid
      };
      
      console.log("Sending ICE candidate to Firebase:", serializedCandidate);
      
      const callRef = doc(db, "calls", this.currentCallId);
      const callDoc = await getDoc(callRef);
      const callData = callDoc.data();
      
      const currentCandidates = callData?.iceCandidates || {};
      const userCandidates = currentCandidates[this.currentUserId] || [];
      
      await updateDoc(callRef, {
        [`iceCandidates.${this.currentUserId}`]: [...userCandidates, serializedCandidate]
      });
      
      console.log("ICE candidate sent successfully");
    } catch (error) {
      console.error("Error sending ICE candidate:", error);
    }
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  // Toggle audio
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  // Generate unique call ID
  generateCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup resources
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Clean up listeners
    if (this.iceCandidateUnsubscribe) {
      this.iceCandidateUnsubscribe();
      this.iceCandidateUnsubscribe = null;
    }
    
    this.remoteStream = null;
    this.currentCallId = null;
    this.otherUserId = null;
    this.pendingIceCandidates = [];
  }

  // Get call status
  getCallStatus() {
    return {
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
      isConnected: this.peerConnection?.connectionState === "connected",
      callId: this.currentCallId,
      connectionState: this.peerConnection?.connectionState || "none",
      iceConnectionState: this.peerConnection?.iceConnectionState || "none",
      signalingState: this.peerConnection?.signalingState || "none",
      pendingCandidates: this.pendingIceCandidates?.length || 0
    };
  }

  // Debug connection information
  debugConnection() {
    if (!this.peerConnection) {
      console.log("No peer connection available");
      return;
    }
    
    console.log("=== WebRTC Connection Debug ===");
    console.log("Connection State:", this.peerConnection.connectionState);
    console.log("ICE Connection State:", this.peerConnection.iceConnectionState);
    console.log("Signaling State:", this.peerConnection.signalingState);
    console.log("Local Description:", this.peerConnection.localDescription ? "Set" : "Not set");
    console.log("Remote Description:", this.peerConnection.remoteDescription ? "Set" : "Not set");
    console.log("Pending ICE Candidates:", this.pendingIceCandidates?.length || 0);
    console.log("Local Stream Tracks:", this.localStream?.getTracks().map(t => t.kind) || []);
    console.log("Remote Stream Tracks:", this.remoteStream?.getTracks().map(t => t.kind) || []);
    console.log("================================");
  }

  // Force connection establishment (for debugging)
  forceConnection() {
    if (!this.peerConnection) {
      console.log("No peer connection available");
      return;
    }
    
    console.log("Forcing connection establishment...");
    
    // Check if we have both descriptions
    if (this.peerConnection.localDescription && this.peerConnection.remoteDescription) {
      console.log("Both descriptions are set, processing pending ICE candidates");
      this.processPendingIceCandidates();
      
      // Try to restart ICE
      if (this.peerConnection.restartIce) {
        console.log("Restarting ICE...");
        this.peerConnection.restartIce();
      }
    } else {
      console.log("Missing descriptions:", {
        local: !!this.peerConnection.localDescription,
        remote: !!this.peerConnection.remoteDescription
      });
    }
  }

  // Manually refresh remote stream (for debugging)
  refreshRemoteStream() {
    if (this.remoteStream) {
      console.log("Manually refreshing remote stream:", {
        id: this.remoteStream.id,
        active: this.remoteStream.active,
        trackCount: this.remoteStream.getTracks().length
      });
      this.onRemoteStream?.(this.remoteStream);
    } else {
      console.log("No remote stream available to refresh");
    }
  }
}

// Create singleton instance
const videoCallManager = new VideoCallManager();

// Export functions for easy use
export const initializeVideoCall = (userId, onLocalStream, onRemoteStream, onCallStateChange) => {
  videoCallManager.initialize(userId, onLocalStream, onRemoteStream, onCallStateChange);
};

export const startVideoCall = (otherUserId) => {
  return videoCallManager.startCall(otherUserId);
};

export const answerVideoCall = (callId) => {
  return videoCallManager.answerCall(callId);
};

export const endVideoCall = () => {
  return videoCallManager.endCall();
};

export const rejectVideoCall = (callId) => {
  return videoCallManager.rejectCall(callId);
};

export const toggleVideo = () => {
  videoCallManager.toggleVideo();
};

export const toggleAudio = () => {
  videoCallManager.toggleAudio();
};

export const getVideoCallStatus = () => {
  return videoCallManager.getCallStatus();
};

export const cleanupVideoCall = () => {
  videoCallManager.cleanup();
};

export const debugVideoCall = () => {
  videoCallManager.debugConnection();
};

export const forceVideoCallConnection = () => {
  videoCallManager.forceConnection();
};

export const refreshRemoteStream = () => {
  videoCallManager.refreshRemoteStream();
};

// Listen for incoming calls
export const listenForIncomingCalls = (userId, callback) => {
  return onSnapshot(
    query(
      collection(db, "calls"),
      where("receiverId", "==", userId),
      where("status", "==", "ringing")
    ),
    (snapshot) => {
      const calls = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(call => call.callerId !== userId); // Filter out self-calls
      
      callback(calls);
    }
  );
};

// Listen for call updates
export const listenForCallUpdates = (callId, callback) => {
  return onSnapshot(doc(db, "calls", callId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() });
    }
  });
};
