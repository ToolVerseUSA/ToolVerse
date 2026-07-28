document.addEventListener('DOMContentLoaded', () => {
    
    const dropZone = document.getElementById('dropZone');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const removeFileBtn = document.getElementById('removeFile');
    const summarizeBtn = document.getElementById('summarizeBtn');
    
    let extractedText = "";

    // --- FILE UPLOAD & DRAG/DROP LOGIC ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    removeFileBtn.addEventListener('click', () => {
        pdfFileInput.value = "";
        extractedText = "";
        fileInfo.style.display = "none";
        dropZone.style.display = "block";
        
        summarizeBtn.disabled = true;
        summarizeBtn.style.background = "#94a3b8";
        summarizeBtn.style.cursor = "not-allowed";
    });

    async function handleFile(file) {
        if (file.type !== "application/pdf") {
            alert("Please upload a valid PDF file.");
            return;
        }

        dropZone.style.display = "none";
        fileNameDisplay.innerText = file.name;
        fileInfo.style.display = "block";

        summarizeBtn.disabled = true;
        summarizeBtn.innerHTML = "⏳ Reading PDF...";
        
        try {
            // Read PDF using PDF.js
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = "";
            // Loop through pages (limit to first 15 pages to avoid massive API payloads)
            const maxPages = Math.min(pdf.numPages, 15); 
            
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + "\n";
            }

            // Truncate to roughly 15,000 characters to fit Llama-3 context windows
            extractedText = fullText.substring(0, 15000); 

            summarizeBtn.innerHTML = "✨ Get Summary";
            summarizeBtn.disabled = false;
            summarizeBtn.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)";
            summarizeBtn.style.cursor = "pointer";

        } catch (error) {
            console.error(error);
            alert("Could not read the PDF file. It might be corrupted or password protected.");
            removeFileBtn.click();
        }
    }

    // --- SUMMARIZATION LOGIC ---
    summarizeBtn.addEventListener('click', async () => {
        
        const focus = document.getElementById('summaryFocus').value.trim();
        const size = document.getElementById('summarySize').value;
        const lang = document.getElementById('summaryLang').value;
        const format = document.getElementById('summaryFormat').value;
        const outSummary = document.getElementById('outSummary');

        if (!extractedText) {
            alert("Please upload a PDF file first.");
            return;
        }

        const originalBtnText = summarizeBtn.innerHTML;
        summarizeBtn.innerHTML = "⏳ Summarizing...";
        summarizeBtn.disabled = true;

        outSummary.innerHTML = "<span style='color: #f87171;'>Analyzing document context... Crafting your summary. Please wait.</span>";

        try {
            // 1. Firebase Auth Check
            if (typeof firebase === 'undefined' || !firebase.apps.length) throw new Error("Firebase is not initialized.");
            
            const user = firebase.auth().currentUser;
            if (!user) {
                alert("🔒 Please login to use Premium Tools.");
                window.location.href = "index.html"; 
                return;
            }

            // 2. Database Credit Check
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            const freeCredits = userDoc.data()?.free_credits || 0;

            if (freeCredits <= 0) {
                alert("🎁 You have run out of Daily Free Credits!");
                outSummary.innerHTML = "<span style='color: #ef4444;'>Insufficient Free Credits. Your Mining tokens are safe!</span>";
                return; 
            }

            // 3. Expert AI Prompt for Summarization
            let focusText = focus ? `Focus especially on: ${focus}.` : "Provide a comprehensive overview of the main topics.";
            
            const systemPrompt = `You are an expert Document Analyst. Summarize the provided document text.
            
            Instructions:
            1. Language: Write the summary entirely in ${lang}.
            2. Format: Use ${format} format.
            3. Length: Keep the summary ${size}.
            4. Focus: ${focusText}
            
            Structure the output nicely with a bold title at the top, followed by the summary. Do not include any filler conversation.`;

            const userPrompt = `DOCUMENT TEXT:\n\n${extractedText}`;

            // 4. Fetch from Vercel Backend
            const response = await fetch('/api/groq-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt })
            });

            const data = await response.json();

            if (response.ok && data.result) {
                // VVIP Formatting for output
                let formattedText = data.result
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f87171;">$1</strong>'); // Highlight bold text in theme color

                outSummary.innerHTML = formattedText;
                
                // 5. Deduct 1 Free Credit
                await userRef.update({
                    free_credits: firebase.firestore.FieldValue.increment(-1)
                });
            } else {
                throw new Error(data.error || "API error occurred while summarizing.");
            }

        } catch (error) {
            console.error("Error:", error);
            outSummary.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${error.message}</span>`;
        } finally {
            summarizeBtn.innerHTML = "✨ Get Summary";
            summarizeBtn.disabled = false;
        }
    });

    // --- COPY & DOWNLOAD ---
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('outSummary').innerText;
            if(textToCopy.includes("Select a PDF file") || textToCopy.includes("⚠️") || textToCopy.includes("Analyzing document")) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
            });
        });
    }

    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => {
            const text = document.getElementById('outSummary').innerText;
            if(text.includes("Select a PDF file") || text.includes("⚠️") || text.includes("Analyzing document")) return;
            
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const anchor = document.createElement('a');
            anchor.href = URL.createObjectURL(blob);
            anchor.download = 'PDF_Summary_ToolVerse.txt';
            anchor.click();
        });
    }
});
