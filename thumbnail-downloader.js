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

        // ==========================================
        // NEW VVIP AUTH & FAST CREDIT CHECK (0ms Delay)
        // ==========================================
        const isAuth = localStorage.getItem('ToolVerse_Auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
        if (!isAuth) {
            alert("🔒 Please login from the Dashboard to use Premium Tools.");
            window.location.href = "index.html"; 
            return;
        }

        let currentCredits = parseInt(localStorage.getItem('tv_agent_credits') || "0");
        if (currentCredits <= 0) {
            alert("🎁 You have run out of Credits!");
            placeholderText.innerText = "Insufficient Credits. Please upgrade in Dashboard.";
            placeholderText.style.color = "#ef4444";
            return; 
        }

        const originalBtnText = extractBtn.innerHTML;
        extractBtn.innerHTML = "⏳ Extracting...";
        extractBtn.disabled = true;

        try {
            // Deduct 1 Credit instantly on UI for lightweight tool
            currentCredits -= 1; 
            localStorage.setItem('tv_agent_credits', currentCredits);

            // Regex to Extract YouTube Video ID
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
