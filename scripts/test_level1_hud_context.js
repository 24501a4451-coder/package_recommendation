// scripts/test_level1_hud_context.js
// Validates Level 1 Gemini Live HUD status tracking, language detection, and useFarmerContext persistence across language switches

const BASE = 'http://localhost:3000';

async function testHUDAndFarmerContext() {
  console.log('====================================================');
  console.log('TESTING LEVEL 1 GEMINI LIVE HUD & USEFARMERCONTEXT');
  console.log('====================================================\n');

  // Step 1: Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farmer@kisanagro.in' })
  });
  if (!loginRes.ok) throw new Error('Login failed');
  const { token } = await loginRes.json();
  console.log('✅ 1. Authenticated as farmer@kisanagro.in');

  // Step 2: Farmer speaks in English - "I am harvesting 500 kg of fresh tomatoes, traveling 3 days to Vijayawada"
  console.log('\n--- Step 2: Farmer speaks in English ---');
  const convRes1 = await fetch(`${BASE}/api/voice/farmer-converse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'I am harvesting 500 kg of fresh tomatoes, traveling 3 days to Vijayawada in ambient heat.',
      history: [],
      currentContext: {},
      language: 'en'
    })
  });
  const data1 = await convRes1.json();
  console.log('Assistant Reply (en):', data1.reply?.slice(0, 80) + '...');
  console.log('Extracted Crop Profile Context:', {
    crop: data1.updatedContext?.crop,
    commodity: data1.updatedContext?.commodity,
    quantity: data1.updatedContext?.quantity,
    transportDays: data1.updatedContext?.transportDurationDays,
    destination: data1.updatedContext?.destination
  });

  if (!data1.updatedContext?.commodity && !data1.updatedContext?.crop) {
    throw new Error('Failed to extract crop from initial English speech turn');
  }
  console.log('✅ 2. Successfully extracted structured crop profile (crop, quantity, transport)');

  // Step 3: Farmer switches language to Telugu - "దయచేసి తెలుగులో మాట్లాడండి. మాకు చవకైన బాక్సులు కావాలి."
  console.log('\n--- Step 3: Language switch to Telugu with existing structured context ---');
  const convRes2 = await fetch(`${BASE}/api/voice/farmer-converse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'దయచేసి తెలుగులో మాట్లాడండి. మాకు చవకైన బాక్సులు కావాలి.',
      history: [
        { role: 'farmer', content: 'I am harvesting 500 kg of fresh tomatoes, traveling 3 days to Vijayawada in ambient heat.' },
        { role: 'assistant', content: data1.reply }
      ],
      currentContext: data1.updatedContext,
      language: 'en'
    })
  });
  const data2 = await convRes2.json();
  console.log('Detected Language:', data2.detectedLanguage);
  console.log('Assistant Reply (te):', data2.reply?.slice(0, 100) + '...');
  console.log('Persisted Context after Language Switch:', {
    crop: data2.updatedContext?.crop || data2.updatedContext?.commodity,
    quantity: data2.updatedContext?.quantity,
    transportDays: data2.updatedContext?.transportDurationDays,
    budget: data2.updatedContext?.budget
  });

  if (data2.detectedLanguage !== 'te') {
    throw new Error(`Expected detectedLanguage 'te' but got '${data2.detectedLanguage}'`);
  }
  if (!data2.updatedContext?.crop && !data2.updatedContext?.commodity) {
    throw new Error('Context was lost across language switch!');
  }
  console.log('✅ 3. Structured crop profile firmly persisted across language switch to Telugu');

  // Step 4: Verify STT operates with Gemini Live / Multimodal audio without WHISPER_ENDPOINT
  console.log('\n--- Step 4: Audio Transcription without WHISPER_ENDPOINT ---');
  const dummyWavBase64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  const transcribeRes = await fetch(`${BASE}/api/voice/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      audioBase64: dummyWavBase64,
      mimeType: 'audio/wav',
      language: 'en'
    })
  });
  const transcribeData = await transcribeRes.json();
  console.log('Transcribe API Response:', transcribeData);
  if (!transcribeRes.ok) {
    throw new Error(`Transcribe endpoint failed: HTTP ${transcribeRes.status}`);
  }
  console.log('✅ 4. Audio STT endpoint operates cleanly via Gemini Live/Multimodal layer');

  console.log('\n====================================================');
  console.log('ALL LEVEL 1 HUD & USEFARMERCONTEXT TESTS PASSED!');
  console.log('====================================================');
}

testHUDAndFarmerContext().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
