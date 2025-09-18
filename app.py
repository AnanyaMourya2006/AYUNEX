# app.py
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ayunex.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -----------------------------
# Database Models
# -----------------------------
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    diagnoses = db.relationship('Diagnosis', backref='patient', lazy=True)

class Diagnosis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    disease_name = db.Column(db.String(100))
    namaste = db.Column(db.String(50))
    icd11 = db.Column(db.String(50))
    snomed = db.Column(db.String(50))
    loinc = db.Column(db.String(50))
    preventive = db.Column(db.String(300))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# -----------------------------
# Disease Database (can expand)
# -----------------------------
disease_db = {
    "fever": {"NAMASTE":"NAM001","ICD11":"1A00","SNOMED":"386661006","LOINC":"8310-5",
              "preventive":"Stay hydrated, rest, avoid cold exposure, maintain hygiene."},
    "cough": {"NAMASTE":"NAM002","ICD11":"RA01","SNOMED":"49727002","LOINC":"10154-3",
              "preventive":"Avoid irritants, stay hydrated, practice hand hygiene."},
    "heartburn": {"NAMASTE":"NAM020","ICD11":"DA10","SNOMED":"235719002","LOINC":"2093-3",
                  "preventive":"Avoid spicy/fatty food, eat small meals, avoid lying down after meals."},
    "headache": {"NAMASTE":"NAM003","ICD11":"1H40","SNOMED":"25064002","LOINC":"20563-1",
                 "preventive":"Maintain hydration, sleep well, manage stress."},
    "diabetes": {"NAMASTE":"NAM010","ICD11":"5A11","SNOMED":"44054006","LOINC":"15074-8",
                 "preventive":"Balanced diet, exercise, monitor sugar levels."}
}

# -----------------------------
# Routes
# -----------------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/dashboard/doctor')
def doctor_dashboard():
    patients = Patient.query.all()
    return render_template('doctor.html', patients=patients)

@app.route('/dashboard/patient')
def patient_dashboard():
    # For simplicity, list all patients, later implement login
    patients = Patient.query.all()
    return render_template('patient.html', patients=patients)

@app.route('/add_patient', methods=['POST'])
def add_patient():
    data = request.form
    name = data.get('name')
    age = data.get('age')
    gender = data.get('gender')
    diagnosis_text = data.get('diagnosis')
    if not name or not diagnosis_text:
        return "Missing data", 400
    
    patient = Patient(name=name, age=age, gender=gender)
    db.session.add(patient)
    db.session.commit()
    
    # Match disease
    matched = []
    for key in disease_db:
        if key.lower() in diagnosis_text.lower():
            info = disease_db[key]
            diag = Diagnosis(patient_id=patient.id,
                             disease_name=key,
                             namaste=info["NAMASTE"],
                             icd11=info["ICD11"],
                             snomed=info["SNOMED"],
                             loinc=info["LOINC"],
                             preventive=info["preventive"])
            db.session.add(diag)
            matched.append(key)
    db.session.commit()
    
    return redirect(url_for('doctor_dashboard'))

@app.route('/get_patient/<int:id>')
def get_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({"error":"Patient not found"}),404
    diagnoses = []
    for d in patient.diagnoses:
        diagnoses.append({
            "disease_name": d.disease_name,
            "NAMASTE": d.namaste,
            "ICD11": d.icd11,
            "SNOMED": d.snomed,
            "LOINC": d.loinc,
            "preventive": d.preventive,
            "timestamp": d.timestamp.strftime("%Y-%m-%d %H:%M")
        })
    return jsonify({"name":patient.name,"age":patient.age,"gender":patient.gender,"diagnoses":diagnoses})

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
