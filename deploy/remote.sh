#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/opt/pipeline}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-itaeris/pipeline_frontend_app:latest}"
BACKEND_IMAGE="${BACKEND_IMAGE:-itaeris/pipeline_backend_app:latest}"
NETWORK="${NETWORK:-pipeline-network}"

on_network() {
  name="$1"
  docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "$name" 2>/dev/null | grep -qx "$NETWORK"
}

join_network() {
  name="$1"
  required="${2:-0}"
  if ! docker inspect "$name" >/dev/null 2>&1; then
    if [ "$required" = 1 ]; then
      echo "container $name is missing; cannot join $NETWORK"
      exit 1
    fi
    echo "skip $name (not present)"
    return 0
  fi
  if on_network "$name"; then
    return 0
  fi
  docker network connect "$NETWORK" "$name"
}

mkdir -p "$APP_DIR"
umask 077
printf '%s\n' "${BACKEND_ENV:-}" > "$APP_DIR/backend.env"
printf '%s\n' "${FRONTEND_ENV:-}" > "$APP_DIR/frontend.env"
chmod 600 "$APP_DIR/backend.env" "$APP_DIR/frontend.env"

if [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
  printf '%s\n' "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
fi

docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK"
join_network mysql 0

if docker inspect pipeline_redis >/dev/null 2>&1; then
  docker start pipeline_redis >/dev/null
else
  docker run -d \
    --name pipeline_redis \
    --network "$NETWORK" \
    --network-alias pipeline_redis \
    --restart unless-stopped \
    redis:7-alpine
fi
join_network pipeline_redis 1

if ! grep -qE '[[:space:]]host\.docker\.local([[:space:]]|$)' /etc/hosts 2>/dev/null; then
  echo "127.0.0.1 host.docker.local" | sudo tee -a /etc/hosts >/dev/null
fi

if [ -d "$APP_DIR/deploy/nginx" ]; then
  sudo cp "$APP_DIR/deploy/nginx/pipeline-frontend.conf" /etc/nginx/conf.d/pipeline-frontend.conf
  sudo cp "$APP_DIR/deploy/nginx/pipeline-backend.conf" /etc/nginx/conf.d/pipeline-backend.conf
  sudo nginx -t
  sudo systemctl reload nginx
elif [ -d "$APP_DIR/nginx" ]; then
  sudo cp "$APP_DIR/nginx/pipeline-frontend.conf" /etc/nginx/conf.d/pipeline-frontend.conf
  sudo cp "$APP_DIR/nginx/pipeline-backend.conf" /etc/nginx/conf.d/pipeline-backend.conf
  sudo nginx -t
  sudo systemctl reload nginx
fi

for name in pipeline_backend_app pipeline_frontend_app; do
  if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    docker stop "$name" || true
    docker rm "$name" || true
  fi
done

docker pull "$BACKEND_IMAGE"
docker pull "$FRONTEND_IMAGE"

docker run -d \
  --name pipeline_backend_app \
  --network "$NETWORK" \
  --network-alias pipeline_backend_app \
  --restart unless-stopped \
  --env-file "$APP_DIR/backend.env" \
  -e REDIS_URL=redis://pipeline_redis:6379 \
  --add-host=host.docker.local:host-gateway \
  -p 2027:4000 \
  "$BACKEND_IMAGE"
join_network pipeline_backend_app 1

ready=0
i=0
while [ "$i" -lt 30 ]; do
  i=$((i + 1))
  if docker exec pipeline_backend_app node -e "fetch('http://127.0.0.1:4000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" != 1 ]; then
  echo "backend health check failed"
  docker logs pipeline_backend_app | tail -n 80
  exit 1
fi

docker exec pipeline_backend_app node /app/migrate.mjs

docker run -d \
  --name pipeline_frontend_app \
  --network "$NETWORK" \
  --network-alias pipeline_frontend_app \
  --restart unless-stopped \
  --env-file "$APP_DIR/frontend.env" \
  -e NEST_API_URL=http://pipeline_backend_app:4000 \
  --add-host=host.docker.local:host-gateway \
  -p 2028:3000 \
  "$FRONTEND_IMAGE"
join_network pipeline_frontend_app 1

for name in pipeline_redis pipeline_backend_app pipeline_frontend_app; do
  if ! on_network "$name"; then
    echo "$name is not on $NETWORK"
    exit 1
  fi
done

echo "deploy ok"
echo "$NETWORK:"
docker network inspect "$NETWORK" -f '{{range .Containers}}{{.Name}} {{end}}'
