const fetch = require('node-fetch');

async function toggleMaintenance(isActive, message = null, estimatedDuration = null) {
  try {
    const response = await fetch('http://localhost:3000/api/maintenance/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Necesitarías la cookie de sesión de un admin aquí
        // Por ahora, vamos a usar la API directamente en la base de datos
      },
      body: JSON.stringify({
        isActive,
        message,
        estimatedDuration
      })
    });

    const result = await response.json();
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Activar mantenimiento
toggleMaintenance(true, 'Mantenimiento programado', 30);