import React from 'react';

const TermsAndServices: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h1 className="text-4xl font-bold mb-8 text-center">
      Términos y Servicios
    </h1>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        1. Aceptación de los Términos
      </h2>
      <p className="mb-2">
        Al acceder y utilizar este sitio web, usted acepta cumplir con estos
        términos y condiciones, así como con todas las leyes y regulaciones
        aplicables.
      </p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">2. Uso del Servicio</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          El usuario se compromete a utilizar el servicio de manera responsable
          y lícita.
        </li>
        <li>
          No está permitido el uso para actividades fraudulentas, ilegales o que
          puedan dañar la integridad del sistema.
        </li>
        <li>
          Nos reservamos el derecho de suspender cuentas que incumplan estos
          términos.
        </li>
      </ul>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">3. Propiedad Intelectual</h2>
      <p className="mb-2">
        Todo el contenido, diseño, logotipos y software son propiedad de
        Broslunas o sus licenciantes. Queda prohibida la reproducción sin
        autorización expresa.
      </p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        4. Modificaciones del Servicio
      </h2>
      <p className="mb-2">
        Nos reservamos el derecho de modificar, suspender o discontinuar el
        servicio en cualquier momento, notificando a los usuarios registrados
        cuando sea posible.
      </p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        5. Limitación de Responsabilidad
      </h2>
      <p className="mb-2">
        No nos hacemos responsables por daños directos o indirectos derivados
        del uso o imposibilidad de uso del servicio.
      </p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">6. Enlaces a Terceros</h2>
      <p className="mb-2">
        Este sitio puede contener enlaces a sitios de terceros. No nos
        responsabilizamos por el contenido o políticas de privacidad de dichos
        sitios.
      </p>
    </section>
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">7. Jurisdicción</h2>
      <p className="mb-2">
        Estos términos se rigen por la legislación española. Cualquier disputa
        será resuelta en los tribunales competentes de España.
      </p>
    </section>
    <section>
      <h2 className="text-2xl font-semibold mb-3">8. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos términos, puede contactarnos en
        soporte@broslunas.com o mediante el formulario de contacto.
      </p>
    </section>
  </main>
);

export default TermsAndServices;
