document.addEventListener("DOMContentLoaded", function () {

const recipient = document.getElementById("recipient");
const subject = document.getElementById("subject");
const tone = document.getElementById("tone");
const purpose = document.getElementById("purpose");

const preview = document.getElementById("emailPreview");
const generate = document.getElementById("generateEmail");

generate.addEventListener("click", function () {

preview.innerHTML = `

<p>Dear ${recipient.value || "Sir/Madam"},</p>

<br>

<p>
${purpose.value || "Your message goes here."}
</p>

<br>

<p>
This email is written in a <strong>${tone.value}</strong> tone.
</p>

<br>

<p>
Kind regards,
</p>

<p>
Your Name
</p>

`;

});

});
