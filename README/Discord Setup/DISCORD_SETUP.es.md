# Guía de configuración de la integración con Discord

Esta guía te acompaña en la configuración de la integración con Discord para VRC Event Creator. Una vez configurada, al crear un evento de VRChat se creará automáticamente un **evento de Discord** correspondiente en tu servidor.

---

## Descripción general

La integración utiliza un **bot de Discord** que tú mismo creas y controlas. Solo necesita un permiso: **Crear eventos**. No lee mensajes, no se une a canales de voz ni hace nada más. Tu token de bot se cifra y almacena localmente — solo se envía a la API de Discord al crear eventos.

Cada grupo de VRChat puede vincularse a un servidor de Discord. Puedes reutilizar el mismo bot en varios grupos/servidores, o usar bots independientes.

---

## Paso 1: Crear una aplicación de Discord

1. Ve al [Discord Developer Portal](https://discord.com/developers/applications)
2. Haz clic en **"New Application"** en la esquina superior derecha
3. Ponle un nombre y haz clic en **Create**

## Paso 2: Crear el bot

1. Haz clic en **"Bot"** en la barra lateral izquierda
2. Haz clic en **"Reset Token"** (o en **"Copy"** si el token aún está visible)
3. **Copia el token inmediatamente** — no podrás verlo de nuevo
4. Deja los Privileged Gateway Intents desactivados — el bot no los necesita

> **Mantén tu token de bot en privado.** Cualquier persona que tenga el token puede actuar en nombre de tu bot. Si lo compartes por accidente, restablécelo de inmediato en el Developer Portal.

## Paso 3: Invitar al bot a tu servidor

1. Haz clic en **"OAuth2"** en la barra lateral izquierda
2. Desplázate hasta **"OAuth2 URL Generator"**
3. En **Scopes**, marca **`bot`**
4. En **Bot Permissions**, marca **`Create Events`**
5. Copia la URL generada en la parte inferior, ábrela en tu navegador, selecciona tu servidor y autoriza

El bot aparecerá en tu lista de miembros pero se mostrará como desconectado — no necesita estar "en ejecución". La aplicación se comunica directamente con la API de Discord usando el token.

## Paso 4: Obtener el ID de tu servidor

1. En Discord, ve a **Ajustes de usuario** > **Avanzado** y activa el **Modo desarrollador**
2. Haz clic derecho en el nombre de tu servidor y selecciona **"Copiar ID del servidor"**

## Paso 5: Configurar en VRC Event Creator

1. Abre **Configuración** > **Opciones avanzadas** > activa **"Habilitar integración con Discord"**
2. Selecciona el grupo de VRChat que deseas vincular, introduce tu token de bot y el ID del servidor, y guarda
3. Usa **"Verificar token del bot"** para confirmar que el token funciona

Cada plantilla de evento tiene un interruptor **"Sincronizar con Discord"** en la pestaña Basics. Está activado por defecto cuando la integración con Discord está activa. Puedes desactivarlo para los eventos que no quieras publicar en Discord.

**La sincronización con Discord nunca bloquea la creación de eventos en VRChat.** Si algo falla en el lado de Discord, tu evento de VRChat se crea con normalidad.

---

## Preguntas frecuentes

### ¿Puedo usar un bot que ya tengo?

Sí, siempre que tenga el permiso **Crear eventos** en el servidor de destino.

### ¿Qué pasa si varias personas del equipo crean eventos?

Cada persona que cree eventos necesita el token de bot en su equipo. Opciones:
- **Compartir el token** con miembros de confianza
- **Designar a una persona para gestionar la sincronización con Discord** mientras los demás desactivan "Sincronizar con Discord"
- **Crear bots independientes** por cada miembro del equipo

### ¿Mi token de bot está seguro?

Tu token de bot se cifra mediante el almacenamiento seguro de tu sistema operativo (Windows DPAPI / macOS Keychain / Linux Secret Service) y se almacena localmente. Solo se envía a la API de Discord.

### ¿Puedo eliminar eventos de Discord desde la aplicación?

No, la aplicación solo los crea. Administra los eventos de Discord directamente en Discord.

---

## Solución de problemas

| Problema | Solución |
|---|---|
| "Token de bot no válido" | Restablece el token en el Developer Portal y pega el nuevo |
| "El bot no tiene permiso para crear eventos" | Vuelve a invitar al bot con el permiso Crear eventos, o añádelo desde Ajustes del servidor > Roles |
| "Servidor de Discord no encontrado" | Verifica el ID del servidor (clic derecho en el servidor > Copiar ID del servidor) |
| "Límite de solicitudes de Discord alcanzado" | Espera un minuto e inténtalo de nuevo |
| Eventos creados en VRChat pero no en Discord | Comprueba que "Sincronizar con Discord" esté activado y que el grupo tenga un token de bot + ID de servidor válidos |
