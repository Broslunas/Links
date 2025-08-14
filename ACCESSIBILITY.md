# Guía de Accesibilidad - BRL Links

Este documento describe las mejoras de accesibilidad implementadas en la aplicación BRL Links y proporciona una guía para probar y mantener estas características.

## Características de Accesibilidad Implementadas

### 1. Navegación por Teclado

#### GlobalHeader (Menú Principal)
- **Tecla Escape**: Cierra el menú móvil
- **Flechas Arriba/Abajo**: Navega entre elementos del menú móvil
- **Tecla Home**: Va al primer elemento del menú
- **Tecla End**: Va al último elemento del menú
- **Tab**: Navegación secuencial con manejo de foco

#### DashboardLayout (Panel de Control)
- **Escape**: Cierra la barra lateral móvil
- **Gestión de foco**: Restaura el foco al botón que abrió la barra lateral
- **Prevención de scroll**: Bloquea el scroll del body cuando la barra lateral está abierta

### 2. Enlaces de Salto (Skip Links)

#### GlobalLayout
- "Saltar al contenido principal" → `#main-content`
- "Saltar a la navegación" → `#main-navigation`

#### DashboardLayout
- "Saltar al contenido principal" → `#main-content`
- "Saltar a la navegación del dashboard" → `#dashboard-navigation`

### 3. Etiquetas ARIA y Estructura Semántica

#### GlobalFooter
- `<footer>` con `role="contentinfo"`
- `aria-label` para la navegación del footer
- Estructura de lista semántica para enlaces

#### GlobalHeader
- `<nav>` con `role="navigation"` y `aria-label`
- `aria-expanded` y `aria-controls` para el botón del menú móvil
- `aria-hidden` para iconos decorativos

#### Sidebar
- `<aside>` con `role="complementary"`
- `aria-label` descriptivos para navegación
- `aria-current="page"` para la página activa
- `role="list"` y `role="listitem"` para estructura de navegación

#### Button Component
- Soporte para `aria-label`, `aria-describedby`, `aria-expanded`, `aria-controls`
- `aria-disabled` para estados deshabilitados
- `aria-hidden` para iconos de carga
- Clase `sr-only` para texto de carga

### 4. Clases de Utilidad

#### sr-only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Guía de Pruebas de Accesibilidad

### 1. Pruebas de Navegación por Teclado

#### Pruebas Básicas
1. **Tab Navigation**: Navega por toda la aplicación usando solo la tecla Tab
2. **Shift+Tab**: Navega hacia atrás
3. **Enter/Space**: Activa botones y enlaces
4. **Escape**: Cierra menús y modales

#### Pruebas Específicas del Menú Móvil
1. Abre el menú móvil con Enter o Space
2. Usa las flechas para navegar entre elementos
3. Presiona Escape para cerrar
4. Verifica que el foco regrese al botón del menú

#### Pruebas de la Barra Lateral del Dashboard
1. Abre la barra lateral móvil
2. Presiona Escape para cerrar
3. Verifica que el foco regrese al botón que la abrió
4. Confirma que el scroll del body se bloquea cuando está abierta

### 2. Pruebas con Lectores de Pantalla

#### Herramientas Recomendadas
- **NVDA** (Windows) - Gratuito
- **JAWS** (Windows) - Comercial
- **VoiceOver** (macOS) - Integrado
- **Orca** (Linux) - Gratuito

#### Elementos a Verificar
1. **Landmarks**: Verifica que se anuncien correctamente (main, navigation, complementary, contentinfo)
2. **Headings**: Confirma la jerarquía de encabezados
3. **Links**: Verifica que los enlaces tengan texto descriptivo
4. **Buttons**: Confirma que los botones tengan etiquetas claras
5. **Form Controls**: Verifica etiquetas y descripciones
6. **Skip Links**: Confirma que sean anunciados y funcionales

### 3. Pruebas Automatizadas

#### Herramientas Recomendadas
- **axe-core**: Biblioteca de pruebas de accesibilidad
- **Lighthouse**: Auditoría de accesibilidad integrada en Chrome
- **WAVE**: Extensión del navegador para evaluación de accesibilidad

#### Comandos de Prueba Sugeridos
```bash
# Instalar dependencias de prueba
npm install --save-dev @axe-core/react jest-axe

# Ejecutar pruebas de accesibilidad
npm run test:a11y
```

### 4. Lista de Verificación Manual

#### Navegación
- [ ] Todos los elementos interactivos son accesibles por teclado
- [ ] El orden de tabulación es lógico
- [ ] Los elementos enfocados tienen indicadores visuales claros
- [ ] Los skip links funcionan correctamente

#### Contenido
- [ ] Las imágenes tienen texto alternativo apropiado
- [ ] Los enlaces tienen texto descriptivo
- [ ] Los botones tienen etiquetas claras
- [ ] Los formularios tienen etiquetas asociadas

#### Estructura
- [ ] Los landmarks están correctamente implementados
- [ ] La jerarquía de encabezados es lógica
- [ ] Las listas usan marcado semántico
- [ ] Los roles ARIA son apropiados

#### Estados
- [ ] Los estados de carga se comunican adecuadamente
- [ ] Los elementos deshabilitados están marcados correctamente
- [ ] Los menús expandidos/colapsados se anuncian
- [ ] Los errores se comunican claramente

## Mantenimiento Continuo

### 1. Revisiones de Código
- Incluir verificaciones de accesibilidad en las revisiones de PR
- Usar linters de accesibilidad (eslint-plugin-jsx-a11y)
- Documentar decisiones de accesibilidad

### 2. Pruebas Regulares
- Ejecutar auditorías de Lighthouse mensualmente
- Probar con lectores de pantalla en cada release
- Validar navegación por teclado en nuevas características

### 3. Capacitación del Equipo
- Mantener al equipo actualizado sobre mejores prácticas
- Proporcionar recursos de aprendizaje
- Establecer estándares de accesibilidad para el proyecto

## Recursos Adicionales

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [React Accessibility Documentation](https://reactjs.org/docs/accessibility.html)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)