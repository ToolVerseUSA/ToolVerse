// ToolVerse Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKYuPIPpwkS70HQ9jc3OdsNiTIDnEnAM8",
    authDomain: "toolverstoken.firebaseapp.com",
    projectId: "toolverstoken",
    storageBucket: "toolverstoken.firebasestorage.app",
    messagingSenderId: "762644487097",
    appId: "1:762644487097:web:dbd8d858e1dc6f3c1bb468",
    measurementId: "G-6VX2WPNEC2"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase initialized successfully for ToolVerse!");
}
