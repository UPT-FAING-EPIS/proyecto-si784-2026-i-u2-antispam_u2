# Guía de Deploy — Aegis Security Gateway en VPS

## Requisitos del servidor
- Ubuntu 22.04 / Debian 12
- Docker + Docker Compose v2
- Puertos 80, 443, 8000, 3000 abiertos en el firewall

## 1. Instalar Docker en el VPS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker compose version   # debe ser 2.x
```

## 2. Subir el proyecto al VPS

```bash
# Desde tu máquina local (Windows):
scp -r "d:\GITHUB\integracion-calidad\aegis-security-gateway" usuario@TU_IP:/opt/aegis

# O clonar desde Git si ya tienes el repo remoto:
git clone https://github.com/TU_USUARIO/aegis-security-gateway /opt/aegis
```

## 3. Configurar variables de entorno

```bash
cd /opt/aegis
cp .env.example .env
nano .env   # Edita TODAS las variables
```

Variables críticas a cambiar:
- `MYSQL_ROOT_PASSWORD` → contraseña fuerte
- `DB_PASSWORD` → contraseña fuerte
- `SECRET_KEY` → `openssl rand -hex 32`
- `NEXTAUTH_SECRET` → `openssl rand -hex 32`
- `NEXTAUTH_URL` → `http://TU_IP_O_DOMINIO:3000`
- `NEXT_PUBLIC_API_URL` → `http://TU_IP_O_DOMINIO:8000`

## 4. Construir y levantar los contenedores

```bash
cd /opt/aegis
docker compose --env-file .env up -d --build
```

## 5. Verificar el estado

```bash
docker compose ps
docker compose logs backend --tail=30
docker compose logs frontend --tail=30

# Health check del backend:
curl http://localhost:8000/health
# Debe responder: {"status":"ok","service":"Aegis Security Gateway"}
```

## 6. Acceder a la aplicación

| Servicio | URL |
|---|---|
| Landing Page + Panel | `http://TU_IP:3000` |
| API Backend + Swagger | `http://TU_IP:8000/docs` |

## 7. (Opcional) Nginx como proxy reverso

```nginx
# /etc/nginx/sites-available/aegis
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/aegis /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# SSL con Let's Encrypt:
sudo certbot --nginx -d tu-dominio.com
```

## 8. Comandos útiles

```bash
# Ver logs en tiempo real:
docker compose logs -f

# Reiniciar solo el backend:
docker compose restart backend

# Actualizar después de cambios:
docker compose up -d --build backend
docker compose up -d --build frontend

# Parar todo:
docker compose down

# Parar y eliminar volúmenes (¡borra la BD!):
docker compose down -v
```
