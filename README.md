# reporteya-invite-function

Edge Function `invite` para Supabase: crea/invita usuarios por email con metadatos (code, dni, first_name, last_name) y redirige a una URL pública para crear contraseña.

## Variables de entorno (Secrets)
- `SB_URL` = URL de tu proyecto Supabase
- `SB_SERVICE_ROLE` = Service Role key (mantener solo en el backend)
- `INVITE_REDIRECT` = URL pública (p. ej. https://reporte-reset.vercel.app)

## Request
```
POST /functions/v1/invite
Content-Type: application/json
{
  "code": "OBRA-AGO-2025",
  "dni": "70297350",
  "email": "user@dominio.com",
  "first_name": "",
  "last_name": ""
}
```

## Respuesta
- `200 {"ok": true}`

## Despliegue
Pega `index.ts` en Edge Functions (invite) y configura los secrets. Deploy desde el dashboard o CLI.
