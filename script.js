// In-memory patient database
let patientsDB = {};

// Navigate to appropriate dashboard
function goToDashboard(role) {
    if(role === "doctor") {
        window.location.href = "doctor.html";
    } else {
        window.location.href = "patient.html";
    }
}

// Add patient record
function addPatient() {
    const name = document.getElementById("patientName").value;
    const age = document.getElementById("patientAge").value;
    const gender = document.getElementById("patientGender").value;
    const diagnosis = document.getElementById("diagnosisText").value || "No diagnosis entered";

    if(name === "") {
        alert("Please enter patient name");
        return;
    }

    patientsDB[name] = {
        age: age,
        gender: gender,
        diagnosis: diagnosis
    };

    document.getElementById("addOutput").innerHTML = `<p>✅ Patient <b>${name}</b> added successfully!</p>`;
    document.getElementById("patientName").value = "";
    document.getElementById("patientAge").value = "";
    document.getElementById("diagnosisText").value = "";
}

// Show all patients
function showPatients() {
    let container = document.getElementById("patientRecords");
    container.innerHTML = "";
    for(let name in patientsDB) {
        const p = patientsDB[name];
        container.innerHTML += `
        <div style="border:2px solid #4CAF50; border-radius:10px; padding:10px; margin:10px 0; background:#f0fff0">
            <h3 style="color:#2E7D32">${name} (${p.gender}, ${p.age} yrs)</h3>
            <p>${p.diagnosis}</p>
        </div>`;
    }
}
