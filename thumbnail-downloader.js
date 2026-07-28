document.addEventListener('DOMContentLoaded', () => {
    
    const extractBtn = document.getElementById('extractBtn');
    if (!extractBtn) return;

    extractBtn.addEventListener('click', async () => {
        
        const urlInput = document.getElementById('ytUrl').value.trim();
        const previewBox = document.getElementById('previewBox');
        const placeholderText = document.getElementById('placeholderText');
        const thumbnailImg = document.getElementById('thumbnailImg');
        const downloadLink = document.getElementById('downloadLink');

        if (urlInput === "") {
            alert("Please paste a valid YouTube URL first.");
            return;
        }

        const originalBtnText = extractBtn.innerHTML;
        extractBtn.innerHTML = "⏳ Extracting...";
        extractBtn.disabled = true;

        try {
            // 1. Firebase Auth Check (Only logged-in users can use ToolVerse tools)
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                throw new Error("Firebase is not initialized.");
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("🔒 Please login to use Premium Tools.");
                window.location.href = "index.html"; 
                return;
            }

            // 2. Database Check (Deduct 1 credit for premium consistency)
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            
            const userDoc = await userRef.get();
            const freeCredits = userDoc.data()?.free_credits || 0;

            if (freeCredits <= 0) {
                alert("🎁 You have run out of Daily Free Credits!");
                placeholderText.innerText = "Insufficient Free Credits. Your Mining tokens are safe!";
                placeholderText.style.color = "#ef4444";
                return; 
            }

            // 3. Regex to Extract YouTube Video ID
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = urlInput.match(regExp);

            if (match && match[2].length === 11) {
                const videoId = match[2];
                
                // Construct MaxRes URL (Highest Quality)
                const maxResUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

                // Update UI
                placeholderText.style.display = "none";
                previewBox.style.border = "none";
                
                thumbnailImg.src = maxResUrl;
                thumbnailImg.style.display = "block";

                downloadLink.href = maxResUrl;
                downloadLink.style.display = "inline-block";

                // 4. Deduct 1 Free Credit for Tool Usage
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });

            } else {
                throw new Error("Invalid YouTube URL. Please check the link and try again.");
            }

        } catch (error) {
            console.error("Error:", error);
            alert(`⚠️ Error: ${error.message}`);
        } finally {
            extractBtn.innerHTML = "📸 Extract 4K Thumbnail";
            extractBtn.disabled = false;
        }
    });
});
