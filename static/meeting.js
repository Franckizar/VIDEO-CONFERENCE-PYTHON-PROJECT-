// Request Permissions
async function requestPermissions() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Stop the test stream after checking permissions
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

// Event Listeners for Meeting Buttons
document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('startMeetingBtn');
    const joinButton = document.getElementById('joinMeetingBtn');

    if (startButton) {
        startButton.addEventListener('click', async () => {
            const hasPermissions = await requestPermissions();
            if (hasPermissions) {
                createOffer();
            }
        });
    }

    if (joinButton) {
        joinButton.addEventListener('click', async () => {
            const hasPermissions = await requestPermissions();
            if (hasPermissions) {
                joinMeeting();
            }
        });
    }
});

// WebRTC Configuration
const signalingServer = window.location.origin;
const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// Create Offer
async function createOffer() {
    try {
        const constraints = { video: { facingMode: 'user' }, audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = stream;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch(`${signalingServer}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'offer', data: pc.localDescription })
        });

        console.log("Offer created and sent.");
    } catch (error) {
        console.error("Error creating offer:", error);
        alert("Error accessing camera/microphone. Please ensure permissions are granted.");
    }
}

// Join Meeting
async function joinMeeting() {
    try {
        const response = await fetch(`${signalingServer}/getOffer`);
        if (!response.ok) throw new Error("Failed to fetch offer.");

        const { sdp, type } = await response.json();
        const remoteDesc = new RTCSessionDescription({ sdp, type });
        await pc.setRemoteDescription(remoteDesc);

        const constraints = { video: { facingMode: 'user' }, audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) remoteVideo.srcObject = stream;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch(`${signalingServer}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'answer', data: pc.localDescription })
        });

        console.log("Answer sent.");
    } catch (error) {
        console.error("Error joining meeting:", error);
        alert("Error joining meeting. Please check permissions and try again.");
    }
}

// ICE Candidate Handling
pc.onicecandidate = (event) => {
    if (event.candidate) {
        fetch(`${signalingServer}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'candidate', data: event.candidate })
        }).catch(error => console.error("Error sending ICE candidate:", error));
    }
};

// On Track Event
pc.ontrack = (event) => {
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = event.streams[0];
};
