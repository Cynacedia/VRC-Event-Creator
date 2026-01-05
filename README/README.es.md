<h1 align="center">
  <img src="../electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://img.shields.io/github/downloads/Cynacedia/VRC-Event-Creator/total?style=plastic&labelColor=555&color=blue" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文（简体）</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.ru.md">Русский</a>
</p>
Una herramienta todo en uno de creación de eventos para VRChat que elimina la configuración repetitiva.
Crea y guarda plantillas de eventos por grupo, genera fechas próximas a partir de patrones recurrentes simples y completa los detalles al instante - perfecta para programar rápidamente reuniones semanales, noches de visualización y eventos comunitarios.


<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="Event creation flow (profile to publish)" />
</p>


## Funcionalidades
- Perfiles/plantillas que rellenan automáticamente los detalles del evento por grupo.
- Generador de patrones recurrentes con lista de próximas fechas y opción manual de fecha/hora.
- Asistente de creación de eventos para calendarios de grupo.
- Vista de modificar eventos para próximos eventos (rejilla + modal de edición).
- Estudio de temas con presets y control total de colores de la UI (compatible con #RRGGBBAA).
- Selector y subida de imágenes de galería para IDs de imagen.
- Localización con selección de idioma en el primer inicio (en, fr, es, de, ja, zh, pt, ko, ru).

## Descarga
- Lanzamientos: https://github.com/Cynacedia/VRC-Event-Creator/releases
- El `.exe` portátil de Windows funciona de forma independiente.

## Privacidad y almacenamiento de datos
Tu contraseña no se guarda. Solo se almacenan en caché los tokens de sesión.
La aplicación almacena sus archivos en el directorio de datos de usuario de Electron (mostrado en Configuración > Información de la aplicación):

- `profiles.json` (plantillas de perfiles)
- `cache.json` (tokens de sesión)
- `settings.json` (configuración de la aplicación)
- `themes.json` (presets de temas y colores personalizados)

Puedes sobrescribir el directorio de datos con la variable de entorno `VRC_EVENT_DATA_DIR`.
En el primer inicio, la aplicación intentará importar un `profiles.json` existente desde la carpeta del proyecto.

__**No compartas archivos de caché ni carpetas de datos de la aplicación.**__

## Notas de uso
- Los perfiles requieren Nombre de perfil, Nombre del evento y Descripción antes de continuar.
- Los grupos privados solo pueden usar Tipo de acceso = Grupo.
- La duración usa DD:HH:MM y tiene un máximo de 31 días.
- Las etiquetas están limitadas a 5 y los idiomas a 3.
- Las subidas a la galería se limitan a PNG/JPG, 64-2048 px, menos de 10 MB y 64 imágenes por cuenta.
- Actualmente VRChat solo permite hasta 10 eventos próximos a la vez.

## Solución de problemas
- Problemas de inicio de sesión: elimina `cache.json` y vuelve a iniciar sesión (usa la carpeta de datos indicada en Información de la aplicación).
- Grupos faltantes: tu cuenta debe tener acceso al calendario en el grupo objetivo.
- Limitación de velocidad: VRChat puede limitar la creación de eventos. Espera y vuelve a intentar, y detente si varias tentativas fallan. No hagas spam de los botones de refresco o creación de eventos.
- Actualizaciones: Algunas funciones se bloquean cuando hay actualizaciones pendientes. Descarga y ejecuta la última versión.

## Descargo de responsabilidad
- Este proyecto no está afiliado ni respaldado por VRChat. Utilízalo bajo tu propio riesgo.
- Los idiomas están traducidos automáticamente y pueden ser inexactos; por favor aporta correcciones.

## Requisitos (compilación desde el código fuente)
- Node.js 20+ (22.21.1 recomendado)
- npm
- Una cuenta de VRChat con permiso para crear eventos en al menos un grupo



