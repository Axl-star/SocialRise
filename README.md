# SocialRise

Ejecuta la aplicación con:

```bash
npm start
```

Después abre `http://localhost:4173`.

La base de datos SQLite se crea automáticamente en `data/socialrise.sqlite`. El navegador nunca recibe contraseñas, saldos ni permisos de administración: esas operaciones se validan en el backend.

Para cambiar la contraseña inicial del administrador antes del primer arranque, define `SOCIALRISE_ADMIN_PASSWORD` al ejecutar el servidor. Después de creado el administrador, usa el panel de cuenta para gestionar usuarios y acreditar depósitos pendientes.
