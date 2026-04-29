# Guía de configuración de la integración de calendario

Esta guía te acompaña en la configuración de la generación de archivos de calendario (.ics), la publicación por webhook de Discord y los eventos programados de Discord en VRC Event Creator. Estas tres funciones son completamente independientes — activa cualquier combinación que se ajuste a tu flujo de trabajo.

---

## Descripción general

VRC Event Creator ofrece tres acciones posteriores a la creación cuando creas o automatizas un evento de VRChat. Cada una se activa independientemente por plantilla y por evento:

- **"Crear invitación de calendario .ics"** — Genera un archivo de calendario `.ics` estándar con recordatorios opcionales, guardado automáticamente en un directorio local
- **"Publicar Webhook de Discord"** — Publica un anuncio en un canal de Discord mediante webhook (con archivo `.ics` adjunto opcional si el calendario también está activado)
- **"Crear evento de Discord"** — Crea un evento programado en tu servidor de Discord mediante bot

Cuando se activan varias funciones, se complementan naturalmente:

| Evento de Discord | Webhook | Calendario (.ics) | Qué ocurre |
|---|---|---|---|
| SÍ | NO | NO | Solo se crea el evento de Discord |
| NO | SÍ | NO | El webhook publica un embed con los detalles del evento |
| NO | NO | SÍ | El archivo `.ics` se guarda en el directorio local |
| SÍ | SÍ | NO | Se crea el evento de Discord + el webhook publica el enlace del evento |
| SÍ | NO | SÍ | Se crea el evento de Discord + el `.ics` se guarda |
| NO | SÍ | SÍ | El webhook publica un embed + `.ics` adjunto, también guardado |
| SÍ | SÍ | SÍ | Evento de Discord + webhook con enlace del evento + `.ics` adjunto + guardado |

---

## Paso 1: Habilitar la generación de archivos de calendario

1. Abre **Configuración** > **Configuración avanzada**
2. Activa **"Habilitar generación de archivos de calendario"**

Esto hace que el interruptor **"Crear invitación de calendario .ics"** esté disponible en las plantillas y en la creación de eventos.

### Directorio de guardado automático

Cuando la generación de archivos de calendario está habilitada, los archivos `.ics` siempre se guardan en un directorio local. La ubicación predeterminada es `Documents/VRC Event Creator .ics/` y se crea al guardar por primera vez.

Los archivos se guardan como `{directorio}/{Nombre del grupo}/{Nombre del evento - Fecha}.ics`. Para cambiar la ubicación, usa el botón **Cambiar** junto a **Directorio de guardado de calendario** en **Configuración** > **Información de la aplicación**.

---

## Paso 2: Configurar el webhook de Discord (opcional)

Un webhook publica anuncios en un canal de Discord específico. Es independiente de los archivos de calendario y los eventos de Discord — puedes usarlo con o sin cualquiera de los dos.

1. En Discord, haz clic derecho en el canal donde quieres que se publiquen los anuncios
2. Haz clic en **Editar canal** > **Integraciones** > **Webhooks** > **Nuevo webhook**
3. Copia la URL del webhook
4. En VRC Event Creator, ve a **Configuración** > **Integración con Discord** > selecciona tu grupo
5. Activa **"Habilitar Webhook"** y pega la URL del webhook
6. Haz clic en **Probar Webhook** para verificar, luego en **Guardar**

Cuando tanto el webhook como el calendario están habilitados para un evento, el archivo `.ics` se adjunta a la publicación del webhook. Cuando solo el webhook está habilitado (sin calendario), el webhook publica un embed con los detalles del evento sin adjunto `.ics`.

Si también se creó un evento de Discord, el mensaje del webhook incluye el enlace al evento de Discord en lugar de un embed.

---

## Paso 3: Configurar plantillas

1. Ve a **Gestionar plantillas** y edita (o crea) una plantilla
2. En la pestaña **Básicos**, verás hasta tres interruptores de publicación (según la configuración):
   - **"Crear invitación de calendario .ics"** — visible cuando la generación de archivos de calendario está habilitada
   - **"Crear evento de Discord"** — visible cuando hay un bot de Discord configurado para el grupo
   - **"Publicar Webhook de Discord"** — visible cuando hay una URL de webhook configurada para el grupo
3. Activa los que desees para esta plantilla
4. Si el calendario está habilitado, la pestaña **Horario** muestra una tarjeta **"Recordatorios de calendario .ics"**
5. Activa **"Habilitar recordatorios de calendario .ics"** y agrega tus intervalos de recordatorio preferidos
6. Guarda la plantilla

Los recordatorios usan intervalos predefinidos compatibles con todas las aplicaciones de calendario principales: 5 min, 10 min, 15 min, 30 min, 1 hora, 2 horas, 4 horas, 8 horas, 12 horas, 1 día, 2 días, 1 semana.

> **Nota:** Algunas aplicaciones de calendario (como Outlook) solo utilizan el primer recordatorio. El recordatorio más largo se coloca primero para mayor compatibilidad. Google Calendar ignora los recordatorios personalizados al importar y usa tu configuración de notificaciones predeterminada.

---

## Paso 4: Crear eventos

Al crear un evento (manualmente o mediante automatización):

- El paso **Fecha** muestra **"Crear invitación de calendario .ics"** (heredado de la plantilla, modificable)
- Debajo, **"Habilitar recordatorios de calendario .ics"** te permite personalizar los recordatorios por evento
- El paso **Detalles** muestra **"Crear evento de Discord"** y **"Publicar Webhook de Discord"** como interruptores separados
- Todos los ajustes de la plantilla se pueden modificar por evento

---

## Preguntas frecuentes

### ¿Qué aplicaciones de calendario admiten archivos .ics?

Todas las principales: Outlook, Apple Calendar, Google Calendar, Thunderbird y cualquier aplicación compatible con el estándar iCalendar.

### ¿Los recordatorios funcionan en todas las aplicaciones de calendario?

Varios recordatorios funcionan en Apple Calendar y Thunderbird. Outlook solo usa el primero. Google Calendar ignora los recordatorios al importar por completo.

### ¿Puedo usar webhooks sin archivos de calendario?

Sí. El webhook publica un embed con los detalles del evento incluso cuando la generación de archivos de calendario está desactivada. Activa "Publicar Webhook de Discord" en tu plantilla sin activar "Crear invitación de calendario .ics".

### ¿Puedo usar webhooks sin la creación de eventos de Discord?

Sí. El webhook, los eventos de Discord y los archivos de calendario son completamente independientes. Cualquier combinación funciona.

### ¿La URL del webhook es confidencial?

Sí — cualquier persona con la URL del webhook puede enviar mensajes a ese canal. Trátala como una contraseña. Se cifra y almacena localmente usando el almacenamiento seguro de tu sistema operativo.

---

## Solución de problemas

| Problema | Solución |
|---|---|
| No se genera el archivo .ics | Verifica que "Habilitar generación de archivos de calendario" esté activado en la Configuración avanzada, y que "Crear invitación de calendario .ics" esté marcado en la plantilla o el evento |
| El webhook no publica | Verifica la URL del webhook con "Probar Webhook" en la configuración de Discord. Comprueba que "Habilitar Webhook" esté activado para el grupo y que "Publicar Webhook de Discord" esté marcado en la plantilla |
| El webhook publica pero sin .ics adjunto | "Crear invitación de calendario .ics" también debe estar habilitado para el evento. Sin esto, el webhook solo publica un embed o enlace de evento |
| Los recordatorios no funcionan en Outlook | Outlook solo admite el primer recordatorio. La aplicación ordena el más largo primero para compatibilidad |
| Los recordatorios no funcionan en Google Calendar | Google Calendar ignora los recordatorios personalizados al importar .ics. Configura los recordatorios manualmente después de importar |
| Los archivos se guardan en la ubicación incorrecta | Los archivos se guardan en `{directorio}/{Nombre del grupo}/`. El predeterminado es `Documents/VRC Event Creator .ics/`. Se puede cambiar en Configuración > Información de la aplicación |
