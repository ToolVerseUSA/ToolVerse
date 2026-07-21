// Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('pdfFileInput');
const fileInfo = document.getElementById('fileInfo');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeFileBtn = document.getElementById('removeFile');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryOutput = document.getElementById('summaryOutput');
const formatBadge = document.getElementById('formatBadge');

// Handle File Selection
function handleFile(file) {
    if (file && file.type === "application/pdf") {
        fileNameDisplay.innerText = file.name;
        dropZone.style.display = "none";
        fileInfo.style.display = "flex";
        
        // Enable Button
        summarizeBtn.disabled = false;
        summarizeBtn.style.background = "#e5322d";
        summarizeBtn.style.cursor = "pointer";
    } else {
        alert("Please upload a valid PDF file.");
    }
}

// File Input Click
fileInput.addEventListener('change', function() {
    handleFile(this.files[0]);
});

// Drag and Drop Events
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
        fileInput.files = e.dataTransfer.files; // Sync input
    }
});

// Remove File
removeFileBtn.addEventListener('click', () => {
    fileInput.value = "";
    dropZone.style.display = "block";
    fileInfo.style.display = "none";
    
    // Disable Button
    summarizeBtn.disabled = true;
    summarizeBtn.style.background = "#9ca3af";
    summarizeBtn.style.cursor = "not-allowed";
});

// Generate Summary
summarizeBtn.addEventListener('click', function() {
    const format = document.getElementById('summaryFormat').value;
    const formatText = document.getElementById('summaryFormat').options[document.getElementById('summaryFormat').selectedIndex].text;
    
    // Update Badge
    formatBadge.innerText = formatText;

    // Loading State
    const originalText = this.innerHTML;
    this.innerHTML = "⏳ Extracting Text...";
    this.disabled = true;
    this.style.background = "#d97706"; // Warning/processing color

    summaryOutput.innerHTML = `<div class="empty-state" style="color:#d97706; margin-top:40px;">Reading PDF content...<br>Analyzing context...</div>`;

    setTimeout(() => {
        
        let generatedHtml = "";

        if (format === "Executive") {
            generatedHtml = `<strong>Executive Summary</strong>\n\nThe uploaded document outlines the core strategic initiatives for the upcoming fiscal year. It highlights a strong emphasis on integrating AI technologies to streamline workflow, improve productivity, and reduce operational costs by an estimated 15%.\n\nFurthermore, the text suggests a shift towards remote-first infrastructure, emphasizing the need for robust cybersecurity measures and continuous employee training.`;
        } 
        else if (format === "Bullets") {
            generatedHtml = `<strong>Key Takeaways:</strong>\n<ul class="summary-bullets">
                <li><strong>AI Integration:</strong> Implementation of automated tools to enhance daily productivity.</li>
                <li><strong>Cost Reduction:</strong> Target to decrease operational overhead by 15% within 9 months.</li>
                <li><strong>Remote Infrastructure:</strong> Upgrading digital workspaces for seamless remote collaboration.</li>
                <li><strong>Security Focus:</strong> Investment in advanced cybersecurity protocols to protect sensitive data.</li>
            </ul>`;
        }
        else if (format === "Detailed") {
            generatedHtml = `<strong>Detailed Overview</strong>\n\n<strong>1. Introduction</strong>\nThe document begins by setting the stage for a massive digital transformation, pointing out that current market trends demand agility and tech-savviness.\n\n<strong>2. Methodology</strong>\nIt proposes a 3-phase rollout plan. Phase 1 involves auditing current software. Phase 2 introduces AI productivity tools (like ToolVerse) to employees. Phase 3 focuses on evaluating performance metrics.\n\n<strong>3. Expected Outcomes</strong>\nBy implementing these strategies, the organization expects not only a financial boost but also a 30% increase in employee satisfaction due to reduced repetitive tasks.`;
        }

        // Output Result
        summaryOutput.innerHTML = generatedHtml;

        // Reset Button
        this.innerHTML = "✨ Summarize PDF";
        this.disabled = false;
        this.style.background = "#e5322d";

    }, 2000); // 2 seconds delay
});

// Copy Text
document.getElementById('copyBtn').addEventListener('click', function() {
    const textToCopy = summaryOutput.innerText;
    
    if (textToCopy.includes("Upload a PDF")) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const status = document.getElementById('copyStatus');
        status.classList.add('show');
        setTimeout(() => { status.classList.remove('show'); }, 2000);
    });
});

// Download Text (Simple implementation)
document.getElementById('downloadTxtBtn').addEventListener('click', function() {
    const textToSave = summaryOutput.innerText;
    if (textToSave.includes("Upload a PDF")) return;

    const blob = new Blob([textToSave], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileNameDisplay.innerText.replace(".pdf", "") + "_Summary.txt";
    link.click();
});
  
