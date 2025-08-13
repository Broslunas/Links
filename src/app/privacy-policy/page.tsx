


import React from "react";

const PrivacyPolicy: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h1 className="text-4xl font-bold mb-8 text-center">Política de Privacidad</h1>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">1. Información que Recopilamos</h2>
      <p className="mb-2">Recopilamos información personal que usted proporciona voluntariamente al registrarse, iniciar sesión, crear enlaces o interactuar con nuestro sitio. Esto puede incluir nombre, correo electrónico, dirección IP, y datos de uso.</p>
      <p className="mb-2">También recopilamos información automáticamente a través de cookies y tecnologías similares para mejorar la experiencia del usuario y analizar el tráfico del sitio.</p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">2. Uso de la Información</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Proveer y mantener el servicio.</li>
        <li>Personalizar la experiencia del usuario.</li>
        <li>Analizar el uso y mejorar la funcionalidad.</li>
        <li>Enviar notificaciones importantes y actualizaciones.</li>
        <li>Prevenir actividades fraudulentas y proteger la seguridad.</li>
      </ul>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">3. Compartir y Divulgación</h2>
      <p className="mb-2">No compartimos su información personal con terceros, excepto cuando sea necesario para cumplir con la ley, proteger nuestros derechos, o mejorar el servicio (por ejemplo, proveedores de análisis).</p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">4. Seguridad de los Datos</h2>
      <p className="mb-2">Implementamos medidas técnicas y organizativas para proteger su información personal contra accesos no autorizados, pérdida o destrucción. Sin embargo, ningún sistema es completamente seguro y no podemos garantizar la seguridad absoluta.</p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">5. Derechos del Usuario</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Acceder, rectificar o eliminar su información personal.</li>
        <li>Solicitar la limitación u oposición al tratamiento de sus datos.</li>
        <li>Retirar el consentimiento en cualquier momento.</li>
      </ul>
      <p className="mt-2">Para ejercer estos derechos, contáctenos a través de nuestro formulario de contacto.</p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">6. Cambios en la Política</h2>
      <p className="mb-2">Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Las actualizaciones serán publicadas en esta página y notificadas a los usuarios registrados.</p>
    </section>
    <section>
      <h2 className="text-2xl font-semibold mb-3">7. Contacto</h2>
      <p>Si tiene preguntas sobre nuestra política de privacidad, puede contactarnos en cualquier momento a través del correo soporte@broslunas.com o el formulario de contacto.</p>
    </section>
  </main>
);

export default PrivacyPolicy;
