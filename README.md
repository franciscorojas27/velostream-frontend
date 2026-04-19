# VeloStream

VeloStream es la interfaz frontend de un servicio que extrae metadatos y permite descargar contenido multimedia desde servicios de vídeo. Ofrece descargas en formato de video (MP4) y audio (MP3).

## Características

- Soporta enlaces largos (con parámetros tipo `?v=VIDEOID`) y enlaces cortos (short links) que incluyen un identificador en la ruta.
- Descarga en formatos MP4 y MP3 y varias calidades (1080, 720, 480, 360).
- Interfaz en español e inglés (selector de idioma en la barra).
- Autenticación basada en cookie `session_token` hacia el backend.

## Requisitos

- Node.js 18+ (recomendado)
- npm / pnpm / yarn
- Un backend/API disponible que exponga los endpoints esperados por la app (ver Variables de entorno)

## Configuración

Las siguientes variables de entorno son relevantes al ejecutar o construir la app:

- `API_URL` — URL del backend que sirve las rutas `/download` y `/info` (usado por las rutas API del frontend).

Ejemplo (en desarrollo):

```bash
export API_URL="https://api.mydomain.com"
```

En Windows PowerShell:

```powershell
$env:API_URL = "https://api.mydomain.com"
```

## Desarrollo

Instala dependencias y arranca en modo desarrollo:

```bash
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## Producción

Construir y ejecutar:

```bash
npm run build
npm start
```

O desplegar en Vercel/Netlify u otra plataforma compatible con Next.js.

## Uso

1. Pega el enlace del contenido (puede ser un enlace largo con parámetros o un short link con identificador en la ruta).
2. El frontend extrae el ID y solicita metadatos al backend.
3. Elige formato (MP4/MP3) y calidad; haz clic en "Extraer" para descargar.

Si el backend responde con un error de autenticación (401/403), la app redirige a `/login`.

## Notas técnicas

- La función de extracción del ID en el frontend soporta tanto identificadores en parámetros (`v=`) como rutas cortas y rutas especiales (`/shorts/`, `/embed/`, etc.).
- Las rutas API internas son:
  - `/api/video/[id]/info` — obtiene metadatos del contenido
  - `/api/video/[id]/download` — proxy de descarga hacia el backend

## Contribuir

Pull requests y issues son bienvenidos. Mantén cambios pequeños y documentados.

## Licencia

MIT
