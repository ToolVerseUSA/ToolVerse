document.getElementById('generatePromptBtn').addEventListener('click', function() {
    
    // Get all parameters
    const model = document.getElementById('aiModel').value;
    const role = document.getElementById('aiRole').value;
    const task = document.getElementById('taskInput').value.trim();
    const tone = document.getElementById('promptTone').value;
    const format = document.getElementById('outputFormat').value;
    
    const outputArea = document.getElementById('promptOutput');

    // Validation
    if (task === "") {
        outputArea.innerHTML = `<span style="color:#ff7b72;">> Error: Main Task parameter is missing. Please enter your task.</span>`;
        return;
    }

    // Loading State
    const originalText = this.innerHTML;
    this.innerHTML = "⚡ Engineering...";
    this.disabled = true;

    outputArea.innerHTML = `<span style="color:#8b949e;">> Compiling parameters...<br>> Applying prompt engineering frameworks...</span>`;

    setTimeout(() => {
        
        let finalPrompt = "";

        // Framework for Text Models (ChatGPT / Claude)
        if (model === "chatgpt") {
            finalPrompt = `Act as a world-class ${role}. \n\nYour main objective is to: ${task}\n\nPlease strictly follow these guidelines:\n- Tone and Style: ${tone}\n- Ensure the output is highly engaging, accurate, and provides immense value.\n- Output Format: ${format}\n\nTake a deep breath and work on this step by step.`;
        } 
        // Framework for Image Models (Midjourney / Stable Diffusion)
        else if (model === "midjourney") {
            finalPrompt = `/imagine prompt: A highly detailed, award-winning visual of: ${task}. \n\nArt Style: ${role} photography style, ${tone}, 8k resolution, Unreal Engine 5 render, hyper-realistic lighting, masterpiece. \n\nParameters: --ar ${format === 'High-Resolution 16:9 Aspect Ratio' ? '16:9' : '4:3'} --v 6.0 --style raw`;
        }

        // Output Result
        outputArea.innerText = finalPrompt;

        // Reset Button
        this.innerHTML = "⚡ Engineer Prompt";
        this.disabled = false;

    }, 800); // Fast compilation simulation
});

// Copy Text
document.getElementById('copyPromptBtn').addEventListener('click', function() {
    const textToCopy = document.getElementById('promptOutput').innerText;
    
    if (textToCopy.includes("> System ready.") || textToCopy.includes("> Error:")) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const status = document.getElementById('copyStatus');
        status.classList.add('show');
        setTimeout(() => { status.classList.remove('show'); }, 2000);
    });
});
