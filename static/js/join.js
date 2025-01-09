// const socket = io();

// document.getElementById("joinForm").addEventListener("submit", (e) => {
//     e.preventDefault();
//     const ip = document.getElementById("ipAddress").value;
//     socket.emit("join", { ip });
// });


const videoElement = document.getElementById("videoElement")
const camarabutton = document.getElementById("camaraButton")
const microphonbutton = document.getElementById("microphonButton")

const accessCamera = () => {
    navigator.mediaDevices({video:true})
    .then((stream) => {
        videoElement.srcObject = stream;
    })
    .catch((error) => {
        console.error("Error",error);
    });
};

// mic
const accessMicrophone = () => {
    navigator.mediaDevices
    getUserMedia({audio:true})
    .then((stream) => {
        
    })
    .catch((error) => {
        console.error("Error",error);
    });
};
cameraButton.addEventListener("click",accessCamera);
cameraButton.addEventListener("click",accessMicrophone);
