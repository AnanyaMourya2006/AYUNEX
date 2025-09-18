let voiceText = "";
function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition not supported.");
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    recognition.onresult = function(event) {
        voiceText = event.results[0][0].transcript;
        document.getElementById("diagnosisText").value = voiceText;
        alert("Voice recognized: " + voiceText);
    }

    recognition.onerror = function(event) {
        alert("Voice recognition error: " + event.error);
    }
}
