// Client (JavaScript)
let pc = null;
let localStream = null;

async function startCall() {
    try {
        // Get local video stream
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false  // Set to true if you want audio
        });
        
        // Display local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Create RTCPeerConnection
        pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        });
        
        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
        
        // Handle incoming streams
        pc.ontrack = function(event) {
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo.srcObject !== event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        const response = await fetch('/offer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sdp: pc.localDescription.sdp,
                type: pc.localDescription.type
            })
        });
        
        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
    } catch (e) {
        console.error("Error starting call:", e);
    }
}

// Handle connection state changes
function handleConnectionStateChange() {
    console.log("Connection state:", pc.connectionState);
    if (pc.connectionState === 'failed') {
        console.log("Connection failed, closing peer connection");
        pc.close();
    }
}