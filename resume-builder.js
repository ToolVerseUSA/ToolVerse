document.addEventListener("DOMContentLoaded", function () {

const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const address = document.getElementById("address");
const skills = document.getElementById("skills");
const education = document.getElementById("education");
const experience = document.getElementById("experience");

const generateBtn = document.getElementById("generateBtn");
const printBtn = document.getElementById("printBtn");

const preview = document.getElementById("preview");

generateBtn.addEventListener("click", function () {

preview.innerHTML = `
<h1>${name.value || "Your Name"}</h1>

<p><strong>Email:</strong> ${email.value}</p>

<p><strong>Phone:</strong> ${phone.value}</p>

<p><strong>Address:</strong> ${address.value}</p>

<hr>

<h3>Skills</h3>
<p>${skills.value.replace(/\n/g,"<br>")}</p>

<h3>Education</h3>
<p>${education.value.replace(/\n/g,"<br>")}</p>

<h3>Experience</h3>
<p>${experience.value.replace(/\n/g,"<br>")}</p>

`;

});

printBtn.addEventListener("click", function () {
window.print();
});

});
