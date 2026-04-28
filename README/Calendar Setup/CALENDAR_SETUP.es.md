# Guía de configuración de la integración de calendario

Esta guía te acompaña en la configuración de la generación de archivos de calendario (.ics) y el envío por webhook de Discord para VRC Event Creator. Una vez configurada, al crear un evento de VRChat se puede generar automáticamente un archivo de invitación de calendario y, opcionalmente, publicarlo en un canal de Discord.

---

## Descripción general

La integración de calendario crea archivos `.ics` estándar que se pueden importar en Outlook, Apple Calendar, Google Calendar y otras aplicaciones de calendario. Estos archivos incluyen los detalles del evento y recordatorios opcionales.

Hay dos métodos de entrega (mutuamente excluyentes por evento):

- **Webhook de Discord** — Publica el archivo `.ics` en un canal de Discord con un embed del evento o un enlace al evento de Discord
- **Guardado automático** — Guarda el archivo `.ics` en un directorio local automáticamente

Si hay un webhook de Discord configurado y el evento está marcado para publicarse en Discord, se utiliza el webhook. De lo contrario, los archivos se guardan en el directorio local configurado.

---

## Paso 1: Habilitar la generación de archivos de calendario

1. Abre **Configuración** > **General**
2. Activa **"Habilitar generación de archivos de calendario"**

Esto hace que las opciones de calendario estén disponibles en las plantillas y en la creación de eventos.

## Paso 2: Configurar el método de entrega

### Opción A: Webhook de Discord (recomendado)

Un webhook publica el archivo de calendario en un canal de Discord específico. No se requiere un bot para el webhook en sí.

1. En Discord, haz clic derecho en el canal donde quieres que se publiquen los archivos de calendario
2. Haz clic en **Editar canal** > **Integraciones** > **Webhooks** > **Nuevo webhook**
3. Copia la URL del webhook
4. En VRC Event Creator, ve a **Configuración** > **Integración con Discord** > selecciona tu grupo
5. Activa **"Publicar .ics en Discord"** y pega la URL del webhook
6. Haz clic en **"Probar Webhook"** para verificar, luego en **"Guardar"**

Si también tienes configurada la creación de eventos de Discord (token de bot), el webhook publicará un enlace al evento de Discord en lugar de un embed independiente. El archivo `.ics` se adjunta en ambos casos.

### Opción B: Guardado automático en directorio local

Cuando no hay un webhook configurado, los archivos `.ics` se guardan automáticamente en un directorio local. La ubicación predeterminada es `Documents/VRC Event Creator .ics/` y se crea al guardar por primera vez.

Los archivos se guardan como `{directorio}/{Nombre del grupo}/{Nombre del evento - Fecha}.ics`. Para cambiar la ubicación, usa el botón **Cambiar** junto a **Directorio de guardado de calendario** en **Configuración** > **Información de la aplicación**.

---

## Paso 3: Configurar plantillas

1. Ve a **Gestionar plantillas** y edita (o crea) una plantilla
2. En la pestaña **Básicos**, activa **"Crear invitación de calendario .ics"**
3. En la pestaña **Horario**, aparecerá una nueva tarjeta **"Recordatorios de calendario .ics"**
4. Activa **"Habilitar recordatorios de calendario .ics"** y agrega tus intervalos de recordatorio preferidos
5. Guarda la plantilla

Los recordatorios usan intervalos predefinidos compatibles con todas las aplicaciones de calendario principales: 5 min, 10 min, 15 min, 30 min, 1 hora, 2 horas, 4 horas, 8 horas, 12 horas, 1 día, 2 días, 1 semana.

> **Nota:** Algunas aplicaciones de calendario (como Outlook) solo utilizan el primer recordatorio. El recordatorio más largo se coloca primero para mayor compatibilidad. Google Calendar ignora los recordatorios personalizados al importar y usa tu configuración de notificaciones predeterminada.

---

## Paso 4: Crear eventos

Al crear un evento (manualmente o mediante automatización):

- El paso **Fecha** muestra un interruptor **"Crear invitación de calendario .ics"** (heredado de la plantilla seleccionada o configurable manualmente)
- Debajo, **"Habilitar recordatorios de calendario .ics"** te permite personalizar los recordatorios por evento
- El paso **Detalles** muestra **"Publicar en Discord"**, que controla tanto el evento de Discord como el envío por webhook

Todos los ajustes de la plantilla se pueden modificar por evento.

---

## Cómo funciona en conjunto

| Eventos de Discord | Webhook | Calendario | Qué ocurre al crear el evento |
|---|---|---|---|
| Activado + configurado | Configurado | Activado | Se crea el evento de Discord, el webhook publica el enlace del evento + .ics |
| Desactivado o no configurado | Configurado | Activado | El webhook publica un embed con los detalles del evento + .ics |
| Cualquiera | No configurado | Activado | El archivo .ics se guarda automáticamente en el directorio local |

---

## Preguntas frecuentes

### ¿Qué aplicaciones de calendario admiten archivos .ics?

Todas las principales: Outlook, Apple Calendar, Google Calendar, Thunderbird y cualquier aplicación compatible con el estándar iCalendar.

### ¿Los recordatorios funcionan en todas las aplicaciones de calendario?

Varios recordatorios funcionan en Apple Calendar y Thunderbird. Outlook solo usa el primero. Google Calendar ignora los recordatorios al importar por completo.

### ¿Puedo usar webhooks sin la creación de eventos de Discord?

Sí. El webhook y el token de bot son funciones independientes. Puedes usar webhooks para la entrega de calendarios sin configurar un bot de Discord.

### ¿La URL del webhook es confidencial?

Sí — cualquier persona con la URL del webhook puede enviar mensajes a ese canal. Trátala como una contraseña. Se cifra y almacena localmente usando el almacenamiento seguro de tu sistema operativo.

---

## Solución de problemas

| Problema | Solución |
|---|---|
| No se genera el archivo .ics | Verifica que "Habilitar generación de archivos de calendario" esté activado en Configuración > General, y que "Crear invitación de calendario .ics" esté marcado en la plantilla o el evento |
| El webhook no publica | Verifica la URL del webhook con "Probar Webhook" en la configuración de Discord. Comprueba que "Publicar .ics en Discord" esté activado para el grupo |
| Los recordatorios no funcionan en Outlook | Outlook solo admite el primer recordatorio. La aplicación ordena el más largo primero para compatibilidad |
| Los recordatorios no funcionan en Google Calendar | Google Calendar ignora los recordatorios personalizados al importar .ics. Configura los recordatorios manualmente después de importar |
| Los archivos se guardan en la ubicación incorrecta | Los archivos se guardan en `{directorio}/{Nombre del grupo}/`. El predeterminado es `Documents/VRC Event Creator .ics/`. Se puede cambiar en Configuración > Información de la aplicación |
