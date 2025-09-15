
# Seguridad y Cumplimiento (OCDE)

- Enlaces únicos por persona (inviteUserByEmail/generateLink)
- Expiración/un solo uso; reenvío invalida enlaces anteriores
- Rate-limit 429 por IP/email en función `invite`
- Auditoría: `audit_invites`, `invite_usage`; retención sugerida 90 días (pg_cron)
- Secrets solo en backend (service role, Postmark)
- RLS ON en tablas de negocio; tablas de auditoría con RLS ON y sin policies para clientes
- HSTS + CSP en Netlify (`_headers`)
- Página de crear contraseña con fallback de sesión (token_hash/type | code), y validaciones UX
- Detección de invitación usada (check_used) y marcado `mark_used` tras setear contraseña
- Consentimiento en app (checkbox Política de Privacidad)

Pendientes operativos:
- Subir mínimos de contraseña a 12 y activar leaked-passwords en Auth
- Definir y documentar políticas de retención y plan de incidentes
