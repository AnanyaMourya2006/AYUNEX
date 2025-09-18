// Patient database in memory
let patientsDB = {};

// Disease database with codes and preventive measures
const diseaseDB = {
    "fever": {
        english_name: "fever",
        regional_names: ["jwar","tamaka jwara"],
        NAMASTE:"NAM001",
        ICD11:"1A00",
        SNOMED:"386661006",
        LOINC:"8310-5",
        prevention:"Stay hydrated, rest, avoid cold exposure, maintain hygiene."
    },
    "cough": {
        english_name:"cough",
        regional_names:["kasa"],
        NAMASTE:"NAM002",
        ICD11:"RA01",
        SNOMED:"49727002",
        LOINC:"10154-3",
        prevention:"Avoid irritants, stay hydrated, practice hand hygiene."
    },
    "heartburn": {
        english_name:"heartburn",
        regional_names:["amlapitta"],
        NAMASTE:"NAM020",
        ICD11:"DA10",
        SNOMED:"235719002",
        LOINC:"2093-3",
        prevention:"Avoid spicy/fatty food, eat small meals, avoid lying down after meals."
    },
    "headache": {
        english_name:"headache",
        regional_names:["shirashula","mathshoola"],
        NAMASTE:"NAM003",
        ICD11:"1H40",
        SNOMED:"25064002",
        LOINC:"20563-1",
        prevention:"Maintain hydration, sleep well, manage stress, avoid prolonged screen time."
    },
    "diabetes": {
        english_name:"diabetes",
        regional_names:["prameha","madhumeha"],
        NAMASTE:"NAM010",
        ICD11:"5A11",
        SNOMED:"44054006",
        LOINC:"15074-8",
        prevention:"Balanced diet, regular exercise, maintain healthy weight, monitor sugar levels."
    }
};

// Add patient record with disease lookup
function addPatient() {
    const name = document.getElementById("patientName").value.trim();
    const age = document.getElementById("patientAge").value;
    const gender = document.getElementById("patientGender").value;
    const diagnosisText = document.getElementById("diagnosisText").value.trim();

    if(!name || (!diagnosisText && !voiceText)) {
        alert("Please enter patient name and diagnosis");
        return;
    }

    let diagnosisResult = diagnosisText || voiceText || "No diagnosis entered";

    // Lookup disease codes
    let matchedDiseases = [];
    for(let key in diseaseDB) {
        let names = [diseaseDB[key].english_name,...diseaseDB[key].regional_names];
        for(let n of names) {
            if(diagnosisResult.toLowerCase().includes(n.toLowerCase())) {
                matchedDiseases.push(diseaseDB[key]);
                break;
            }
        }
    }

    let diagnosisDetails = matchedDiseases.length>0 
        ? matchedDiseases.map(d => 
            `<b>${d.english_name}</b><br>
            NAMASTE: ${d.NAMASTE}<br>
            ICD-11: ${d.ICD11}<br>
            SNOMED: ${d.SNOMED}<br>
            LOINC: ${d.LOINC}<br>
            Preventive Measures: ${d.prevention}<br><hr>`).join('')
        : diagnosisResult;

    // Save patient
    patientsDB[name] = {
        age, gender, diagnosis: diagnosisDetails
    };

    document.getElementById("addOutput").innerHTML = `<p>✅ Patient <b>${name}</b> added successfully!</p>`;
    document.getElementById("patientName").value = "";
    document.getElementById("patientAge").value = "";
    document.getElementById("diagnosisText").value = "";
    voiceText = "";
}

// Display all patients
function showPatients() {
    let container = document.getElementById("patientRecords");
    container.innerHTML = "";
    for(let name in patientsDB) {
        const p = patientsDB[name];
        container.innerHTML += `<div class="card" style="background:#f0fff0; padding:10px;">
            <h3 style="color:#2E7D32">${name} (${p.gender}, ${p.age} yrs)</h3>
            ${p.diagnosis}
        </div>`;
    }
}

// -------- Voice Recognition --------
let voiceText = "";
function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition not supported in this browser.");
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
        alert("Error in voice recognition: " + event.error);
    }
}

