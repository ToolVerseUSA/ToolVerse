document.addEventListener('DOMContentLoaded', () => {
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspacePanel = document.getElementById('workspacePanel');
    const splitBtn = document.getElementById('splitBtn');
    const statusMessage = document.getElementById('statusMessage');
    
    // UI Elements
    const pdfFileName = document.getElementById('pdfFileName');
    const pdfPageCount = document.getElementById('pdfPageCount');
    const btnModeRange = document.getElementById('btnModeRange');
    const btnModeAll = document.getElementById('btnModeAll');
    const rangeInputWrapper = document.getElementById('rangeInputWrapper');
    const allPagesHint = document.getElementById('allPagesHint');
    const rangeInput = document.getElementById('rangeInput');

    let currentFile = null;
    let currentPdfDoc = null;
    let totalPages = 0;
    let currentMode = 'range'; // 'range' or 'all'

    // --- UPLOAD LOGIC ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); dropZone.classList.add('dragover');
    });

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
        dropZone.innerHTML = `<i class="fa-solid fa-spinner fa-spin upload-icon"></i><h2>Loading PDF...</h2><p>Please wait</p>`;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const { PDFDocument } = PDFLib;
            currentPdfDoc = await PDFDocument.load(arrayBuffer);
            totalPages = currentPdfDoc.getPageCount();

            pdfFileName.innerText = file.name;
            pdfPageCount.innerText = totalPages;
            
            // Suggest a default range (e.g., 1-2) if document is long enough
            rangeInput.value = totalPages > 1 ? `1-${Math.min(3, totalPages)}` : `1`;

            dropZone.style.display = "none";
            workspacePanel.style.display = "block";
            statusMessage.style.display = "none";
        } catch (error) {
            console.error(error);
            alert("Error loading PDF. It might be corrupted or password protected.");
            resetWorkspace();
        }
    }

    window.resetWorkspace = function() {
        currentFile = null;
        currentPdfDoc = null;
        totalPages = 0;
        workspacePanel.style.display = "none";
        dropZone.style.display = "block";
        dropZone.innerHTML = `<i class="fa-solid fa-file-pdf upload-icon"></i><h2>Select PDF file</h2><p>or drop a PDF here</p>`;
    };

    // --- MODE TOGGLE LOGIC ---
    btnModeRange.addEventListener('click', () => {
        currentMode = 'range';
        btnModeRange.classList.add('active');
        btnModeAll.classList.remove('active');
        rangeInputWrapper.classList.add('active');
        allPagesHint.classList.remove('active');
        rangeInputWrapper.style.display = 'block';
        allPagesHint.style.display = 'none';
    });

    btnModeAll.addEventListener('click', () => {
        currentMode = 'all';
        btnModeAll.classList.add('active');
        btnModeRange.classList.remove('active');
        rangeInputWrapper.classList.remove('active');
        allPagesHint.classList.add('active');
        rangeInputWrapper.style.display = 'none';
        allPagesHint.style.display = 'block';
    });

    // --- PAGE RANGE PARSER ---
    function parseRange(inputStr, maxPages) {
        const pages = new Set();
        const parts = inputStr.split(',');
        for (let part of parts) {
            part = part.trim();
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i - 1); // 0-indexed for PDF-Lib
                    }
                }
            } else {
                const num = Number(part);
                if (!isNaN(num) && num >= 1 && num <= maxPages) pages.add(num - 1); // 0-indexed
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    }

    // --- SPLIT LOGIC ---
    splitBtn.addEventListener('click', async () => {
        if (!currentPdfDoc) return;

        const originalBtnText = splitBtn.innerHTML;
        splitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
        splitBtn.disabled = true;
        statusMessage.style.display = "none";

        try {
            // Firebase Auth & Credit Check (ToolVerse standard)
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                const user = firebase.auth().currentUser;
                if (!user) {
                    alert("🔒 Please login to use Premium Tools.");
                    window.location.href = "index.html"; 
                    return;
                }
                const db = firebase.firestore();
                const userRef = db.collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                if ((userDoc.data()?.free_credits || 0) <= 0) {
                    alert("🎁 You have run out of Daily Free Credits!");
                    splitBtn.innerHTML = originalBtnText; splitBtn.disabled = false; return; 
                }
                await userRef.update({ free_credits: firebase.firestore.FieldValue.increment(-1) });
            }

            const { PDFDocument } = PDFLib;

            if (currentMode === 'range') {
                // MODE 1: Extract Custom Range into ONE new PDF
                const pagesToExtract = parseRange(rangeInput.value, totalPages);
                if (pagesToExtract.length === 0) {
                    alert("Please enter a valid page range.");
                    splitBtn.innerHTML = originalBtnText; splitBtn.disabled = false; return;
                }

                const newPdf = await PDFDocument.create();
                const copiedPages = await newPdf.copyPages(currentPdfDoc, pagesToExtract);
                copiedPages.forEach((page) => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                triggerDownload(pdfBytes, `ToolVerse_Extracted_${currentFile.name}`, "application/pdf");

            } else if (currentMode === 'all') {
                // MODE 2: Extract Every Page into a ZIP file using JSZip
                const zip = new JSZip();
                
                // Create a folder inside the ZIP based on original file name
                const baseName = currentFile.name.replace('.pdf', '');
                const folder = zip.folder(`Split_${baseName}`);

                for (let i = 0; i < totalPages; i++) {
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(currentPdfDoc, [i]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();
                    folder.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
                }

                splitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Zipping files...`;
                const zipBlob = await zip.generateAsync({ type: "blob" });
                triggerDownload(zipBlob, `ToolVerse_Split_${baseName}.zip`, "application/zip");
            }

            statusMessage.style.display = "block";

        } catch (error) {
            console.error("Error splitting PDF:", error);
            alert("An error occurred during splitting. Please try again.");
        } finally {
            splitBtn.innerHTML = originalBtnText;
            splitBtn.disabled = false;
        }
    });

    function triggerDownload(data, filename, type) {
        const blob = data instanceof Blob ? data : new Blob([data], { type: type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }
});
