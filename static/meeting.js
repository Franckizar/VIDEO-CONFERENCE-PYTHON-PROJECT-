document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startMeetingBtn');
    const joinButton = document.getElementById('joinMeetingBtn');
  
    if (startButton) {
      startButton.addEventListener('click', async () => {
        if (await requestPermissions()) {
          createOffer(); 
        }
      });
    }
  
    if (joinButton) {
      joinButton.addEventListener('click', async () => {
        if (await requestPermissions()) {
          joinMeeting(); 
        }
      });
    }
  });
  
  async function requestPermissions() {
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  
      // Stop the test stream (as we only need to check for permissions)
      stream.getTracks().forEach(track => track.stop()); 
  
      return true; 
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        alert('Please allow camera and microphone access.');
      } else {
        console.error("Error requesting permissions:", error);
        alert("An error occurred while requesting permissions.");
      }
      return false; 
    }
  }
  
  // ... rest of your createOffer() and joinMeeting() functions ...
// --------------------------------------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startMeetingBtn');
    const joinButton = document.getElementById('joinMeetingBtn');
    
    if (startButton) {
        startButton.addEventListener('click', async () => {
            // Request permissions first
            const hasPermissions = await requestMediaPermissions();
            if (hasPermissions) {
                createOffer();
            }
        });
    }
    
    if (joinButton) {
        joinButton.addEventListener('click', async () => {
            // Request permissions first
            const hasPermissions = await requestMediaPermissions();
            if (hasPermissions) {
                joinMeeting();
            }
        });
    }
});
// -------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startMeetingBtn');
    const joinButton = document.getElementById('joinMeetingBtn');
    
    if (startButton) {
        startButton.addEventListener('click', async () => {
            try {
                // Ask for permissions first
                const permissionResult = await navigator.permissions.query({ name: 'camera' });
                if (permissionResult.state === 'denied') {
                    alert('Camera permission is required for this application. Please enable it in your browser settings.');
                    return;
                }

                const mediaPermission = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .catch(err => {
                        alert('Please allow camera and microphone access to use this application.');
                        throw err;
                    });
                
                // If permissions granted, proceed with creating offer
                if (mediaPermission) {
                    mediaPermission.getTracks().forEach(track => track.stop()); // Stop the test stream
                    createOffer();
                }
            } catch (error) {
                console.error("Permission error:", error);
                alert('Please allow camera and microphone access in your browser settings to use this application.');
            }
        });
    }
    
    if (joinButton) {
        joinButton.addEventListener('click', async () => {
            try {
                // Ask for permissions first
                const permissionResult = await navigator.permissions.query({ name: 'camera' });
                if (permissionResult.state === 'denied') {
                    alert('Camera permission is required for this application. Please enable it in your browser settings.');
                    return;
                }

                const mediaPermission = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .catch(err => {
                        alert('Please allow camera and microphone access to use this application.');
                        throw err;
                    });
                
                // If permissions granted, proceed with joining
                if (mediaPermission) {
                    mediaPermission.getTracks().forEach(track => track.stop()); // Stop the test stream
                    joinMeeting();
                }
            } catch (error) {
                console.error("Permission error:", error);
                alert('Please allow camera and microphone access in your browser settings to use this application.');
            }
        });
    }
});

const signalingServer = window.location.origin;
const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

async function createOffer() {
    try {
        const constraints = {
            video: {
                facingMode: 'user'
            },
            audio: true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(`${signalingServer}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'offer', data: pc.localDescription })
        });

        const result = await response.json();
        console.log("Offer sent:", result);
    } catch (error) {
        console.error("Error creating offer:", error);
        alert("Error accessing camera/microphone. Please ensure permissions are granted.");
    }
}

async function joinMeeting() {
    try {
        const hostIp = document.getElementById('hostIp').value;
        const response = await fetch(`${signalingServer}/getOffer`);
        const { sdp, type } = await response.json();

        const remoteDesc = new RTCSessionDescription({ sdp, type });
        await pc.setRemoteDescription(remoteDesc);

        const constraints = {
            video: {
                facingMode: 'user'
            },
            audio: true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch(`${signalingServer}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'answer', data: pc.localDescription })
        });

        console.log("Answer sent!");
    } catch (error) {
        console.error("Error joining meeting:", error);
        alert("Error joining meeting. Please check permissions and try again.");
    }
}

pc.onicecandidate = (event) => {
    if (event.candidate) {
        fetch(`${signalingServer}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'candidate', data: event.candidate })
        }).catch(error => console.error("Error sending ICE candidate:", error));
    }
};

pc.ontrack = (event) => {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
    }
};