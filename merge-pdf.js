document.addEventListener('DOMContentLoaded', () => {
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspacePanel = document.getElementById('workspacePanel');
    const fileGrid = document.getElementById('fileGrid');
    const mergeBtn = document.getElementById('mergeBtn');
    const statusMessage = document.getElementById('statusMessage');
    
    // Store files with unique IDs to track them after drag-and-drop reordering
    let selectedFiles = new Map();

    // Initialize SortableJS for Drag & Drop reordering
    new Sortable(fileGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.pdf-item'
    });

    // --- FILE UPLOAD LOGIC ---
    dropZone.addEventListener('click', () => fileInput.click());

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
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
        fileInput.value = "";
    });

    function handleFiles(files) {
        dropZone.style.display = "none";
        workspacePanel.style.display = "block";
        statusMessage.style.display = "none";

        Array.from(files).forEach(file => {
            if (file.type === "application/pdf") {
                const uniqueId = 'pdf_' + Math.random().toString(36).substr(2, 9);
                selectedFiles.set(uniqueId, file);
                renderFileCard(uniqueId, file.name);
            } else {
                alert(`"${file.name}" is not a valid PDF file.`);
            }
        });
        
        updateMergeButtonState();
    }

    // --- RENDER PDF CARDS ---
    function renderFileCard(id, fileName) {
        const card = document.createElement('div');
        card.className = 'pdf-item';
        card.setAttribute('data-id', id);
        
        let displayName = fileName;
        if(displayName.length > 15) displayName = displayName.substring(0, 15) + '...';

        card.innerHTML = `
            <div class="remove-btn" onclick="removeFile('${id}')"><i class="fa-solid fa-xmark"></i></div>
            <i class="fa-solid fa-grip drag-handle"></i>
            <i class="fa-solid fa-file-pdf pdf-icon"></i>
            <div class="file-name" title="${fileName}">${displayName}</div>
        `;
        
        fileGrid.appendChild(card);
    }

    window.removeFile = function(id) {
        selectedFiles.delete(id);
        const card = document.querySelector(`.pdf-item[data-id="${id}"]`);
        if (card) card.remove();
        
        if (selectedFiles.size === 0) {
            dropZone.style.display = "block";
            workspacePanel.style.display = "none";
        }
        updateMergeButtonState();
    };

    function updateMergeButtonState() {
        if (selectedFiles.size < 2) {
            mergeBtn.disabled = true;
            mergeBtn.innerHTML = "Select at least 2 PDFs";
        } else {
            mergeBtn.disabled = false;
            mergeBtn.innerHTML = `Merge PDFs <i class="fa-solid fa-arrow-right"></i>`;
        }
    }

    // --- MERGE LOGIC (USING PDF-LIB) ---
    mergeBtn.addEventListener('click', async () => {
        
        if (selectedFiles.size < 2) return;

        const originalBtnText = mergeBtn.innerHTML;
        mergeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
        mergeBtn.disabled = true;
        statusMessage.style.display = "none";

        try {
            // Client-Side Merge
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            // Get current order of files from the DOM (after dragging)
            const domOrderIds = Array.from(fileGrid.children).map(card => card.getAttribute('data-id'));

            for (const id of domOrderIds) {
                const file = selectedFiles.get(id);
                if (file) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
            }

            // Save and Download
            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = "ToolVerse_Merged.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            statusMessage.style.display = "block";

        } catch (error) {
            console.error("Error merging PDFs:", error);
            alert("An error occurred while merging the PDFs. Ensure none of them are password protected.");
        } finally {
            mergeBtn.innerHTML = originalBtnText;
            mergeBtn.disabled = false;
        }
    });
});
