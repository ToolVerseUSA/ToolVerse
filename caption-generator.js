// AI Caption Generator

const captions = {

professional:
"🚀 {topic}\n\nDiscover smarter ways to grow with {topic}. Stay ahead with innovation and keep improving every day.\n\n#Success #Growth #Innovation",

friendly:
"✨ Loving everything about {topic}! 😊\n\nWhat do you think? Let us know in the comments! ❤️\n\n#Fun #Community #Sharing",

motivational:
"💪 Every big success starts with one small step.\n\nKeep learning, keep building, and never give up on {topic}. 🚀\n\n#Motivation #Success #DreamBig",

funny:
"😂 Me trying to understand {topic} at 2 AM...\n\nMission failed successfully! 😅\n\n#Funny #Meme #Life",

marketing:
"🔥 Looking for the best {topic} solution?\n\nSave time, work smarter, and boost your productivity today!\n\n#Business #Marketing #AI"

};

const generateBtn = document.getElementById("generateCaption");
const clearBtn = document.getElementById("clearCaption");
const copyBtn = document.getElementById("copyCaption");

const topic = document.getElementById("topic");
const tone = document.getElementById("tone");
const output = document.getElementById("captionOutput");

generateBtn.addEventListener("click", () => {

const userTopic = topic.value.trim();

if(userTopic===""){
alert("Please enter a topic.");
return;
}

const selectedTone = tone.value;

let caption = captions[selectedTone];

caption = caption.replaceAll("{topic}", userTopic);

output.innerText = caption;

});

clearBtn.addEventListener("click", () => {

topic.value = "";

output.innerHTML = "<p>Your caption will appear here...</p>";

});

copyBtn.addEventListener("click", () => {

navigator.clipboard.writeText(output.innerText);

alert("Caption copied!");

});
