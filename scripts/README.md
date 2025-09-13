# Scripts de Utilidad

## extract-sitemap-links.ts

Script para extraer enlaces del sitemap de BrosLunas y crear links acortados en la base de datos.

## delete-recent-links.js

Script para eliminar todos los enlaces creados en la última hora. Útil para limpiar datos de prueba o revertir importaciones masivas.

### Funcionalidad

1. **Descarga el sitemap** de `https://videos.broslunas.com/sitemap-0.xml`
2. **Filtra URLs** que contengan `/title/`
3. **Extrae el slug** de cada URL (la parte después de `/title/`)
4. **Limpia el slug** para que sea válido según las reglas del modelo Link
5. **Crea links** en la base de datos usando el primer usuario encontrado

### Uso

```bash
# Instalar dependencias (si es necesario)
npm install

# Ejecutar el script
npm run extract-sitemap
```

### Configuración

El script usa:
- La conexión a MongoDB configurada en el proyecto
- El primer usuario encontrado en la base de datos como propietario de los links
- Configuración automática de títulos y descripciones

### Características

- ✅ **Validación de slugs**: Limpia y valida automáticamente los slugs
- ✅ **Detección de duplicados**: No crea links si el slug ya existe
- ✅ **Manejo de errores**: Continúa procesando aunque algunos enlaces fallen
- ✅ **Progreso en tiempo real**: Muestra el progreso del procesamiento
- ✅ **Resumen final**: Estadísticas de links creados, omitidos y errores
- ✅ **Pausas automáticas**: Evita sobrecargar la base de datos

### Salida esperada

```
🚀 Iniciando extracción de enlaces del sitemap...
✅ Conectado a la base de datos
📥 Descargando sitemap...
✅ Sitemap descargado correctamente
📊 Encontradas 150 URLs con "title" de 500 URLs totales
👤 Usando usuario: user@example.com
[1/150] Procesando: video-ejemplo-1
✅ Link creado: video-ejemplo-1 -> https://videos.broslunas.com/title/video-ejemplo-1
...
📈 Resumen del proceso:
✅ Links creados: 145
⚠️  Links omitidos: 3
❌ Errores: 2
📊 Total procesado: 150
🔌 Conexión a la base de datos cerrada
🎉 Script completado exitosamente
```

### Notas importantes

- El script asigna todos los links al primer usuario encontrado en la base de datos
- Los slugs se limpian automáticamente para cumplir con las reglas del modelo
- Si un slug ya existe, se omite (no se sobrescribe)
- Los links se crean como permanentes (no temporales) y privados por defecto

---

## delete-recent-links.js

### Funcionalidad

1. **Analiza enlaces recientes** creados en la última hora
2. **Muestra estadísticas** antes de la eliminación
3. **Lista ejemplos** de los enlaces que se eliminarán
4. **Elimina masivamente** todos los enlaces recientes
5. **Verifica la eliminación** para confirmar el resultado

### Uso

```bash
# Ejecutar el script de eliminación
npm run delete-recent-links
```

### Características

- ✅ **Análisis previo**: Muestra estadísticas antes de eliminar
- ✅ **Ejemplos informativos**: Lista algunos enlaces que se eliminarán
- ✅ **Eliminación masiva**: Borra todos los enlaces de la última hora
- ✅ **Verificación**: Confirma que la eliminación fue exitosa
- ✅ **Manejo de errores**: Gestión robusta de errores
- ✅ **Conexión segura**: Cierra automáticamente la conexión a la DB

### Salida esperada

```
🔍 Analizando enlaces recientes...

📊 Estadísticas actuales:
   Total de enlaces: 250
   Enlaces creados en la última hora: 139
   Enlaces que permanecerán: 111

==================================================
⚠️  ELIMINACIÓN DE ENLACES RECIENTES
==================================================
🗑️  Iniciando eliminación de enlaces recientes...
✅ Conectado a la base de datos
🕐 Buscando enlaces creados después de: 13/9/2025 15:30:45
📊 Encontrados 139 enlaces creados en la última hora

📋 Ejemplos de enlaces que se eliminarán:
  1. a-traves-de-mi-ventana -> https://videos.broslunas.com/title/a-traves-de-mi-ventana/
     Creado: 13/9/2025 16:15:23
  2. breaking-bad-1 -> https://videos.broslunas.com/title/breaking-bad-1/
     Creado: 13/9/2025 16:15:24
  ... y 137 enlaces más

⚠️  ADVERTENCIA: Esta acción eliminará permanentemente estos enlaces
🚀 Procediendo con la eliminación...

✅ Eliminación completada:
   📊 Enlaces eliminados: 139
   🕐 Criterio: Creados después de 13/9/2025 15:30:45
✅ Verificación: No quedan enlaces recientes en la base de datos
🔌 Conexión a la base de datos cerrada

🎉 Proceso completado exitosamente
```

### Notas importantes

- ⚠️ **IRREVERSIBLE**: La eliminación es permanente y no se puede deshacer
- 🕐 **Criterio temporal**: Solo elimina enlaces creados en la última hora
- 📊 **Estadísticas previas**: Siempre muestra qué se va a eliminar antes de hacerlo
- 🔒 **Seguro**: No afecta enlaces más antiguos de una hora