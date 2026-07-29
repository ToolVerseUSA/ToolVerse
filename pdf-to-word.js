document.addEventListener('DOMContentLoaded', () => {
    
    // Set PDF.js Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspacePanel = document.getElementById('workspacePanel');
    const convertBtn = document.getElementById('convertBtn');
    const resultBox = document.getElementById('resultBox');
    const pdfFileName = document.getElementById('pdfFileName');

    let currentFile = null;
    let fileArrayBuffer = null;

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

    async function processFile(file) {
        if (file.type !== "application/pdf") {
            alert(`Please upload a valid PDF file.`);
            return;
        }
        currentFile = file;
        pdfFileName.innerText = file.name;
        
        try {
            fileArrayBuffer = await file.arrayBuffer();
            dropZone.style.display = "none";
            workspacePanel.style.display = "block";
            resultBox.style.display = "none";
        } catch (error) {
            alert("Error reading file.");
        }
    }

    window.resetWorkspace = function() {
        currentFile = null;
        fileArrayBuffer = null;
        workspacePanel.style.display = "none";
        dropZone.style.display = "block";
    };

    // --- CONVERSION LOGIC ---
    convertBtn.addEventListener('click', async () => {
        if (!fileArrayBuffer) return;

        const originalBtnText = convertBtn.innerHTML;
        convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Extracting Text...`;
        convertBtn.disabled = true;
        resultBox.style.display = "none";

        try {
            // Firebase Auth & Credit Check (ToolVerse Standard)
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const user = firebase.auth().currentUser;
                if (!user) { alert("🔒 Please login to use Premium Tools."); window.location.href = "index.html"; return; }
                const db = firebase.firestore();
                const userRef = db.collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                if ((userDoc.data()?.free_credits || 0) <= 0) {
                    alert("🎁 You have run out of Daily Free Credits!");
                    convertBtn.innerHTML = originalBtnText; convertBtn.disabled = false; return; 
                }
                await userRef.update({ free_credits: firebase.firestore.FieldValue.increment(-1) });
            }

            // Step 1: Read PDF using PDF.js
            const pdfDoc = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
            let fullTextLines = [];

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Page ${i} of ${pdfDoc.numPages}...`;
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                
                let lastY = -1;
                let currentLine = "";

                // Very basic line construction logic
                textContent.items.forEach((item) => {
                    if (lastY !== item.transform[5] && currentLine !== "") {
                        fullTextLines.push(currentLine);
                        currentLine = "";
                    }
                    currentLine += item.str + " ";
                    lastY = item.transform[5];
                });
                if (currentLine !== "") fullTextLines.push(currentLine);
                fullTextLines.push(""); // Page break separation
            }

            // Step 2: Build Word Document using docx library
            convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating DOCX...`;
            
            const { Document, Packer, Paragraph, TextRun } = docx;
            
            // Map text lines to Word Paragraphs
            const docParagraphs = fullTextLines.map(textLine => {
                return new Paragraph({
                    children: [ new TextRun(textLine) ],
                });
            });

            const doc = new Document({
                sections: [{ properties: {}, children: docParagraphs }]
            });

            // Step 3: Export & Download
            const blob = await Packer.toBlob(doc);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            const baseName = currentFile.name.replace('.pdf', '');
            link.download = `ToolVerse_Converted_${baseName}.docx`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            resultBox.style.display = "block";

        } catch (error) {
            console.error("Conversion error:", error);
            alert("An error occurred during conversion. PDF might be scanned (images only) or password protected.");
        } finally {
            convertBtn.innerHTML = originalBtnText;
            convertBtn.disabled = false;
        }
    });
});
