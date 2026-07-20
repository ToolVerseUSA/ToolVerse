// =====================================
// ToolVerse AI Grammar Checker
// =====================================

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const checkBtn = document.getElementById("checkBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

checkBtn.addEventListener("click", () => {

let text = inputText.value.trim();

if(text === ""){
outputText.innerHTML = "Please enter some text.";
return;
}

// Remove extra spaces
text = text.replace(/\s+/g," ");

// Capitalize first letter
text = text.charAt(0).toUpperCase() + text.slice(1);

// Common spelling corrections
const corrections = {

" i ":" I ",
" dont ":" don't ",
" cant ":" can't ",
" wont ":" won't ",
" didnt ":" didn't ",
" doesnt ":" doesn't ",
" isnt ":" isn't ",
" im ":" I'm ",
" ive ":" I've ",
" ill ":" I'll ",
" youre ":"you're ",
" theres ":"there's ",
" thats ":"that's ",
" teh ":"the ",
" recieve ":"receive ",
" adress ":"address ",
" seperate ":"separate ",
" occured ":"occurred ",
" sucess ":"success ",
" becuase ":"because "

};

text = " " + text + " ";

for(const wrong in corrections){
text = text.replaceAll(wrong, corrections[wrong]);
}

text = text.trim();

outputText.innerHTML = text;

});

copyBtn.addEventListener("click",()=>{

navigator.clipboard.writeText(outputText.innerText);

alert("Corrected text copied!");

});

clearBtn.addEventListener("click",()=>{

inputText.value="";
outputText.innerHTML="Your corrected text will appear here...";

});
