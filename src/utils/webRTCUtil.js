const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isCaller = false;
    this.onRemoteStream = null;
    this.onIceCandidate = null;
  }

  // Initialize peer connection
  initPeerConnection() {
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };
  }

  // Start local media (camera and microphone)
  async startLocalMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  // Stop local media
  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Create offer
  async createOffer() {
    this.isCaller = true;
    this.initPeerConnection();
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    return offer;
  }

  // Create answer
  async createAnswer(offer) {
    this.isCaller = false;
    this.initPeerConnection();
    
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  // Set remote description (answer)
  async setRemoteDescription(answer) {
    await this.peerConnection.setRemoteDescription(answer);
  }

  // Add ICE candidate
  async addIceCandidate(candidate) {
    await this.peerConnection.addIceCandidate(candidate);
  }

  // Close connection
  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.stopLocalMedia();
    this.remoteStream = null;
  }
}