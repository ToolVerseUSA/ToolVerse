document.addEventListener('DOMContentLoaded', () => {
    
    // Set PDF.js Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspacePanel = document.getElementById('workspacePanel');
    const convertBtn = document.getElementById('convertBtn');
    const resultBox = document.getElementById('resultBox');
    const pdfFileName = document.getElementById('pdfFileName');
    
    const standardBtn = document.getElementById('standardBtn');
    const advancedBtn = document.getElementById('advancedBtn');

    let currentFile = null;
    let fileArrayBuffer = null;
    let conversionMode = 'standard';

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

    window.selectMode = function(mode) {
        conversionMode = mode;
        if (mode === 'standard') {
            standardBtn.classList.add('active');
            advancedBtn.classList.remove('active');
        } else {
            advancedBtn.classList.add('active');
            standardBtn.classList.remove('active');
        }
    };

    // --- CONVERSION LOGIC ---
    convertBtn.addEventListener('click', async () => {
        if (!fileArrayBuffer) return;

        const originalBtnText = convertBtn.innerHTML;
        convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Layout...`;
        convertBtn.disabled = true;
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
                    convertBtn.innerHTML = originalBtnText; convertBtn.disabled = false; return; 
                }
                await userRef.update({ free_credits: firebase.firestore.FieldValue.increment(-1) });
            }

            // Read PDF using PDF.js
            const pdfDoc = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
            let docParagraphs = [];
            const { Document, Packer, Paragraph, TextRun } = docx;

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Reading Page ${i} of ${pdfDoc.numPages}...`;
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                
                let lastY = -1;
                let currentLine = "";

                // Advanced Layout tracking vs Standard
                textContent.items.forEach((item) => {
                    const currentY = item.transform[5];
                    
                    if (lastY !== currentY && currentLine.trim() !== "") {
                        // Advanced mode adds empty spacing if there is a big gap between lines
                        if (conversionMode === 'advanced' && lastY !== -1) {
                            const gap = Math.abs(lastY - currentY);
                            if (gap > 30) {
                                docParagraphs.push(new Paragraph({ children: [new TextRun("")] })); // Empty Line
                            }
                        }
                        
                        docParagraphs.push(new Paragraph({ children: [new TextRun(currentLine)] }));
                        currentLine = "";
                    }
                    currentLine += item.str + " ";
                    lastY = currentY;
                });
                
                if (currentLine.trim() !== "") {
                    docParagraphs.push(new Paragraph({ children: [new TextRun(currentLine)] }));
                }
                
                // Add page break at the end of each page for Advanced mode
                if (conversionMode === 'advanced' && i < pdfDoc.numPages) {
                    docParagraphs.push(new Paragraph({ children: [new TextRun("--- Page Break ---")] }));
                }
            }

            // Build Word Document using docx library
            convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Formatting DOCX...`;
            
            // If the document is totally empty (Scanned images PDF)
            if (docParagraphs.length === 0) {
                docParagraphs.push(new Paragraph({ 
                    children: [new TextRun("No readable text found. The original PDF might be a scanned image.")] 
                }));
            }

            const doc = new Document({
                sections: [{ properties: {}, children: docParagraphs }]
            });

            // Export & Download
            const blob = await Packer.toBlob(doc);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            const baseName = currentFile.name.replace('.pdf', '');
            const modeSuffix = conversionMode === 'advanced' ? '_Advanced' : '';
            link.download = `ToolVerse_Word${modeSuffix}_${baseName}.docx`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            resultBox.style.display = "block";

        } catch (error) {
            console.error("Conversion error:", error);
            alert("An error occurred during conversion. PDF might be password protected.");
        } finally {
            convertBtn.innerHTML = originalBtnText;
            convertBtn.disabled = false;
        }
    });
});
