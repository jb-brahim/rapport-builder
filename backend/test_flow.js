import fs from 'fs';

const API_URL = 'http://localhost:5000/api';

async function runTestFlow() {
  console.log('\n--- Starting PFE Rapport Builder Test Flow ---');

  // 1. Register User (or Login if already exists)
  console.log('\n1. 👤 Registering/Logging in user...');
  let cookie;
  let res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test Student", email: "test@student.com", password: "password123", role: "student"
    })
  });
  
  if (res.status === 400) {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "test@student.com", password: "password123" })
    });
  }
  
  cookie = res.headers.get('set-cookie');
  if (!cookie) throw new Error("Failed to authenticate user");
  console.log('✅ User authenticated successfully!');

  // 2. Create Rapport
  console.log('\n2. 📄 Creating a blank Draft Rapport...');
  res = await fetch(`${API_URL}/rapports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ templateId: null })
  });
  const rapport = await res.json();
  const rapportId = rapport._id;
  console.log(`✅ Rapport created! ID: ${rapportId}`);

  // 3. AI Generation
  console.log('\n3. 🧠 Answering Wizard questions: Calling AI to build Company Presentation...');
  const answers = {
    companyName: "TechCorp Tunisie",
    sector: "DevOps & Cloud Computing",
    role: "Ingénieur logiciel stagiaire",
    projectTitle: "Platforme Cloud PFE"
  };
  
  console.log("\tWizard Inputs:", answers);

  res = await fetch(`${API_URL}/ai/generate-company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ language: 'FR', answers })
  });
  const aiResult = await res.json();
  console.log('\n🤖 AI System Output:\n--------------------\n', aiResult.text, '\n--------------------');

  // 4. Saving Answers
  console.log('\n4. 💾 Simulating 30-sec Auto-Save of the answers...');
  const wizardAnswers = {
    ...answers,
    companyPresentation: aiResult.text
  };
  
  res = await fetch(`${API_URL}/rapports/${rapportId}/autosave`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      currentStep: 4,
      wizardAnswers,
      stepCompletion: [100, 100, 100, 100, 0, 0, 0, 0, 0]
    })
  });
  const saveResult = await res.json();
  console.log(`✅ ${saveResult.message} at ${saveResult.lastSavedAt}`);

  // 5. Generate DOCX
  console.log('\n5. 📝 Calling Export Controller to generate DOCX...');
  res = await fetch(`${API_URL}/export/${rapportId}/docx`, {
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  
  if (res.ok) {
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(`rapport_${rapportId}.docx`, Buffer.from(buffer));
    console.log(`🎉 Success! File saved as rapport_${rapportId}.docx in your backend folder.`);
  } else {
    console.error('❌ Export failed');
  }

  console.log('\n--- Test Flow Complete! ---');
}

runTestFlow().catch(console.error);
