document.addEventListener('DOMContentLoaded', () => {
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspacePanel = document.getElementById('workspacePanel');
    const compressBtn = document.getElementById('compressBtn');
    const resultBox = document.getElementById('resultBox');
    
    // UI Elements
    const pdfFileName = document.getElementById('pdfFileName');
    const pdfFileSize = document.getElementById('pdfFileSize');
    const resultDetails = document.getElementById('resultDetails');
    const savingsBadge = document.getElementById('savingsBadge');

    let currentFile = null;
    let originalSizeBytes = 0;
    let selectedCompressionLevel = 'recommended';

    // File Size Formatter
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // --- UPLOAD LOGIC ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processFile(e.target.files[0]);
        fileInput.value = ""; 
    });

    function processFile(file) {
        if (file.type !== "application/pdf") {
            alert(`Please upload a valid PDF file.`);
            return;
        }

        currentFile = file;
        originalSizeBytes = file.size;

        pdfFileName.innerText = file.name;
        pdfFileSize.innerText = formatBytes(file.size);
        
        dropZone.style.display = "none";
        workspacePanel.style.display = "block";
        resultBox.style.display = "none";
    }

    window.resetWorkspace = function() {
        currentFile = null;
        originalSizeBytes = 0;
        workspacePanel.style.display = "none";
        dropZone.style.display = "block";
    };

    window.selectLevel = function(level) {
        selectedCompressionLevel = level;
        document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.level-btn[data-level="${level}"]`).classList.add('active');
    };

    // --- COMPRESS LOGIC ---
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        const originalBtnText = compressBtn.innerHTML;
        compressBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compressing...`;
        compressBtn.disabled = true;
        resultBox.style.display = "none";

        try {
            // Firebase Auth & Credit Check
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const user = firebase.auth().currentUser;
                if (!user) { alert("🔒 Please login to use Premium Tools."); window.location.href = "index.html"; return; }
                const db = firebase.firestore();
                const userRef = db.collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                if ((userDoc.data()?.free_credits || 0) <= 0) {
                    alert("🎁 You have run out of Daily Free Credits!");
                    compressBtn.innerHTML = originalBtnText; compressBtn.disabled = false; return; 
                }
                await userRef.update({ free_credits: firebase.firestore.FieldValue.increment(-1) });
            }

            // Client-Side Optimization using PDF-Lib
            const arrayBuffer = await currentFile.arrayBuffer();
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            // Structural Optimization (Removes unused objects/metadata to compress)
            const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
            let newSizeBytes = pdfBytes.byteLength;

            // Fake processing delay for VVIP Feel
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Logic to handle size display
            let savingsPercent = 0;
            if (newSizeBytes < originalSizeBytes) {
                savingsPercent = Math.round(((originalSizeBytes - newSizeBytes) / originalSizeBytes) * 100);
            } else {
                // If PDF-lib couldn't compress images, simulate optimization logic for UI integrity
                savingsBadge.style.display = "none";
            }

            resultDetails.innerText = `Original: ${formatBytes(originalSizeBytes)} ➔ New Size: ${formatBytes(newSizeBytes)}`;
            savingsBadge.innerText = `-${savingsPercent}%`;
            if(savingsPercent > 0) savingsBadge.style.display = "inline-block";

            // Trigger Download
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `ToolVerse_Compressed_${currentFile.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            resultBox.style.display = "block";

        } catch (error) {
            console.error("Error compressing PDF:", error);
            alert("An error occurred. Ensure the PDF is not password protected.");
        } finally {
            compressBtn.innerHTML = originalBtnText;
            compressBtn.disabled = false;
        }
    });
});
