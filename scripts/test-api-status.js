const fetch = require('node-fetch');

async function testAPIStatus() {
  try {
    console.log('Probando API de status...');
    
    const response = await fetch('http://localhost:3000/api/maintenance/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Status code:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('Respuesta raw:', result);
    
    try {
      const json = JSON.parse(result);
      console.log('Respuesta JSON:', JSON.stringify(json, null, 2));
    } catch (parseError) {
      console.log('Error parseando JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Error en la petición:', error.message);
  }
}

testAPIStatus();