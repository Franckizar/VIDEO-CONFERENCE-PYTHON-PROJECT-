const socket = io();

// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startMeetingBtn = document.getElementById('startMeetingBtn');
const joinMeetingBtn = document.getElementById('joinMeetingBtn');
const hostIpInput = document.getElementById('hostIp');

// WebRTC Configuration (with your TURN server credentials)
const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com' },
      { urls: 'stun:stun1.l.google.com' },
      {
        urls: 'turn:192.168.33.67:3478', // Replace with your actual TURN server address
        username: 'franck', // Replace with your actual TURN username
        credential: '12345' // Replace with your actual TURN password
      }
    ]
  };

let localStream;
let peerConnection;
let roomId;

// Request media permissions and start local video
async function setupLocalVideo() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    localVideo.srcObject = localStream;
    console.log("Local video and audio captured successfully."); 
  } catch (err) {
    console.error('Error accessing media devices:', err);
    alert('Unable to access camera and microphone. Please check permissions.');
  }
}

// Initialize WebRTC peer connection
function initializePeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  // Handle incoming remote tracks
  peerConnection.ontrack = event => {
    console.log('Received remote track:', event.streams[0]);
    remoteVideo.srcObject = event.streams[0]; 
  };

  // Handle and send ICE candidates
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      console.log('Sending ICE candidate:', event.candidate);
      socket.emit('candidate', {
        room: roomId,
        candidate: event.candidate
      });
    }
  };

  // Add local tracks after connection established
  peerConnection.addEventListener('connectionstatechange', () => {
    if (peerConnection.connectionState === 'connected') {
      console.log("Peer connection established.");
      if (localStream) { 
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }
    }
  });
}

// Host meeting function
async function hostMeeting() {
  roomId = 'host-' + Math.random().toString(36).substr(2, 9);
  await setupLocalVideo(); // Ensure local video is set up before initializing peer connection
  initializePeerConnection();

  socket.emit('create_room', { room: roomId, user: 'host' });
  console.log('Created room:', roomId);
  alert(`Share your host IP with participants to join the meeting.`);
}

// Join meeting function
async function joinMeeting() {
  const hostIp = hostIpInput.value.trim();
  if (!hostIp) {
    alert('Please enter a valid host IP address.');
    return;
  }

  roomId = hostIp;
  await setupLocalVideo(); // Ensure local video is set up before initializing peer connection
  initializePeerConnection();

  socket.emit('join_room', { room: roomId, user: 'participant' });

  try {
    const offer = await peerConnection.createOffer();
    console.log('Sending offer:', offer);
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { room: roomId, offer });
  } catch (err) {
    console.error('Error creating offer:', err);
  }
}

// Socket.IO event handlers
socket.on('offer', async data => {
  console.log('Received offer:', data.offer);
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    console.log('Sending answer:', answer);
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { room: roomId, answer });
  } catch (err) {
    console.error('Error handling offer:', err);
  }
});

socket.on('answer', async data => {
  console.log('Received answer:', data.answer);
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } catch (err) {
    console.error('Error handling answer:', err);
  }
});

socket.on('candidate', async data => {
  console.log('Received ICE candidate:', data.candidate);
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  } catch (err) {
    console.error('Error adding ICE candidate:', err);
  }
});

// Event listeners
if (startMeetingBtn) {
  startMeetingBtn.addEventListener('click', hostMeeting);
}

if (joinMeetingBtn) {
  joinMeetingBtn.addEventListener('click', joinMeeting);
}

// Handle user leaving
window.onbeforeunload = () => {
  if (roomId) {
    socket.emit('leave_room', { room: roomId });
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
};