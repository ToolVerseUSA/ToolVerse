const pdfFile = document.getElementById("pdfFile");
const fileName = document.getElementById("fileName");
const extractBtn = document.getElementById("extractBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryOutput = document.getElementById("summaryOutput");
const copySummary = document.getElementById("copySummary");

let extractedText = "";

// Show selected file name
pdfFile.addEventListener("change", function () {

if (this.files.length > 0) {

fileName.textContent = this.files[0].name;

} else {

fileName.textContent = "No PDF selected.";

}

});

// Extract Text (Demo Version)
extractBtn.addEventListener("click", function () {

if (!pdfFile.files.length) {

alert("Please select a PDF file.");

return;

}

extractedText =
"This is a demo PDF extraction.\n\nIn the next version, ToolVerse will read the actual PDF text.";

summaryOutput.textContent = extractedText;

});

// Summarize (Demo Version)
summarizeBtn.addEventListener("click", function () {

if (extractedText === "") {

alert("Please extract the PDF first.");

return;

}

summaryOutput.textContent =
"📄 Summary:\n\nThis PDF discusses important information. This is currently a demo summary. Real AI-powered PDF summarization will be added in the next version.";

});

// Copy Summary
copySummary.addEventListener("click", function () {

navigator.clipboard.writeText(summaryOutput.textContent);

alert("Summary copied successfully!");

});
