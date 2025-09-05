# Panel de Tiempo Real - Broslunas Links

## Descripción

El panel de tiempo real (`/dashboard/realtime`) proporciona una vista en vivo de la actividad de los enlaces del usuario, mostrando eventos recientes, estadísticas actualizadas y datos geográficos con un **mapa interactivo**.

## Características Implementadas

### 1. Estadísticas en Tiempo Real
- **Usuarios Activos**: Número de usuarios únicos en los últimos 5 minutos
- **Clicks Última Hora**: Total de clicks en la última hora
- **Clicks Hoy**: Total de clicks del día actual
- **Enlace Popular**: El enlace con más clicks del día

### 2. Eventos Recientes
- Lista de los últimos 50 eventos de click
- Información detallada de cada evento:
  - Título del enlace
  - Ubicación geográfica (ciudad, país)
  - Tipo de dispositivo (móvil, tablet, escritorio)
  - Navegador utilizado
  - Tiempo transcurrido desde el evento

### 3. Mapa Geográfico Interactivo ✨
- **Mapa Mundial**: Visualización completa usando OpenStreetMap
- **Marcadores Dinámicos**: Círculos que representan la actividad por país
- **Tamaño Proporcional**: El tamaño del marcador refleja el número de clicks
- **Colores por Intensidad**: 
  - 🔴 Rojo intenso: ≥50% de la actividad
  - 🟠 Naranja: ≥30% de la actividad
  - 🟡 Amarillo: ≥15% de la actividad
  - 🟢 Verde: ≥5% de la actividad
  - 🔵 Azul: <5% de la actividad
- **Popups Informativos**: Detalles al hacer click en cada marcador
- **Vista Alternativa**: Toggle entre mapa y lista de países
- **Top 10 países** con más actividad
- **Datos de las últimas 24 horas**

## Componentes Creados

### Frontend Components
```
src/components/features/realtime/
├── RealtimeStats.tsx      # Tarjetas de estadísticas en tiempo real
├── RealtimeEvents.tsx     # Lista de eventos recientes
├── RealtimeMap.tsx        # Componente principal con toggle mapa/lista
├── InteractiveMap.tsx     # Mapa interactivo con Leaflet
└── index.ts              # Exportaciones
```

### API Endpoints
```
src/app/api/analytics/realtime/
├── stats/route.ts         # GET - Estadísticas generales
├── events/route.ts        # GET - Eventos recientes
└── geographic/route.ts    # GET - Datos geográficos
```

### Estilos
```
src/styles/leaflet.css     # Estilos personalizados para Leaflet
```

### Página Principal
```
src/app/dashboard/realtime/page.tsx  # Página principal del panel
```

## Tecnologías del Mapa Interactivo

### Dependencias
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1", 
  "@types/leaflet": "^1.9.8",
  "date-fns": "^2.30.0"
}
```

### Características Técnicas
- **Leaflet**: Biblioteca de mapas interactivos ligera y potente
- **React-Leaflet**: Integración perfecta con React
- **OpenStreetMap**: Tiles del mapa base gratuitos
- **Dynamic Loading**: Carga del lado del cliente para evitar problemas de SSR
- **Responsive Design**: Se adapta a diferentes tamaños de pantalla
- **Dark Mode Support**: Estilos personalizados para modo oscuro

## Funcionalidades Técnicas

### Actualización Automática
- **Estadísticas**: Se actualizan cada 5 segundos
- **Eventos**: Se actualizan cada 3 segundos  
- **Datos Geográficos**: Se actualizan cada 10 segundos
- **Mapa**: Se actualiza automáticamente con nuevos datos

### Indicadores de Estado
- Indicador de conexión en tiempo real
- Estados de carga para cada componente
- Animaciones para eventos en vivo
- Marcadores animados en el mapa

### Seguridad
- Autenticación requerida para todos los endpoints
- Solo se muestran datos del usuario autenticado
- IPs hasheadas para privacidad

### Datos de Demostración
- Datos de prueba automáticos cuando no hay actividad real
- Permite ver el funcionamiento completo del panel
- Se reemplazan automáticamente por datos reales cuando están disponibles

## Uso

1. Navegar a `/dashboard/realtime`
2. El panel se conecta automáticamente y comienza a mostrar datos
3. Los datos se actualizan automáticamente sin necesidad de refrescar la página
4. **Interactuar con el mapa**:
   - Hacer zoom con la rueda del ratón o controles
   - Hacer click en los marcadores para ver detalles
   - Alternar entre vista de mapa y lista con los botones
5. El indicador de conexión muestra el estado en tiempo real

## Próximas Mejoras

### Completadas ✅
- [x] **Mapa interactivo** con Leaflet
- [x] **Marcadores dinámicos** con tamaños y colores proporcionales
- [x] **Popups informativos** con detalles de cada país
- [x] **Toggle entre vistas** mapa/lista
- [x] **Datos de prueba** para demostración

### Pendientes 🚧
- [ ] Implementar WebSockets para actualizaciones más eficientes
- [ ] Implementar filtros por rango de fechas
- [ ] Añadir notificaciones push para eventos importantes
- [ ] Implementar gráficos de tendencias en tiempo real
- [ ] Añadir exportación de datos en tiempo real
- [ ] Mejorar el mapa con clustering de marcadores
- [ ] Añadir animaciones de transición en el mapa
- [ ] Implementar heatmap para densidad de clicks
- [ ] Añadir controles de tiempo (última hora, 24h, 7 días)

## Estructura de Datos

### Evento de Analytics
```typescript
interface RealtimeEvent {
  id: string;
  linkId: string;
  linkTitle: string;
  linkSlug: string;
  timestamp: string;
  country: string;
  city: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
}
```

### Estadísticas
```typescript
interface Stats {
  activeUsers: number;
  clicksLastHour: number;
  clicksToday: number;
  topLink: {
    title: string;
    clicks: number;
  } | null;
}
```

### Datos Geográficos
```typescript
interface CountryData {
  country: string;
  countryCode: string;
  clicks: number;
  percentage: number;
  lat?: number;  // Coordenadas para el mapa
  lng?: number;  // Coordenadas para el mapa
}
```

## Capturas de Funcionalidad

El panel incluye:
- 📊 **4 tarjetas de estadísticas** actualizadas en tiempo real
- 📋 **Lista de eventos recientes** con detalles completos
- 🗺️ **Mapa mundial interactivo** con marcadores proporcionales
- 🔄 **Actualizaciones automáticas** sin recargar la página
- 🌓 **Soporte para modo oscuro** en todos los componentes
- 📱 **Diseño responsive** para móviles y tablets