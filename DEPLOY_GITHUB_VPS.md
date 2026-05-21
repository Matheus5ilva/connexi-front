# Deploy GitHub Actions + VPS Hostinger

Este guia cobre o deploy sem Docker do frontend React/Vite e sua integracao com o backend NestJS.

## 1. Estrategia

Fluxo recomendado:

```text
feature/* -> develop -> main
```

- `develop`: homologacao.
- `main`: producao.
- push/merge na `main`: deploy automatico via GitHub Actions.

O frontend e servido pelo Nginx e acessa a API por `/api`, mantendo o mesmo host/subdominio do tenant.

## 2. Preparacao do repositorio

Antes do primeiro commit, confirme que nao serao versionados:

```text
.env
.env.*
node_modules
dist
coverage
logs
arquivos temporarios
```

Comandos iniciais:

```bash
git init
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/my-consultorio-front.git
git add .
git commit -m "Preparar frontend para deploy"
git push -u origin main
```

## 3. `.env.example`

Variavel principal:

```env
VITE_API_URL={origin}/api
```

Tambem existe compatibilidade com:

```env
VITE_API_BASE_URL={origin}/api
```

Use:

```env
VITE_APP_HOSTNAME_BASE=meudominio.com.br
VITE_API_PORT=same
VITE_API_BASE_PATH=/api
```

## 4. Secrets do GitHub

Cadastre em `Settings -> Secrets and variables -> Actions`:

```text
VPS_HOST
VPS_USER
VPS_PORT
VPS_SSH_KEY
FRONTEND_PATH
FRONTEND_DIST_PATH
```

`FRONTEND_DIST_PATH` e opcional. Use apenas se o Nginx servir uma pasta diferente de `FRONTEND_PATH/dist`.

## 5. SSH da VPS

Use uma chave exclusiva para deploy:

```bash
ssh-keygen -t ed25519 -C "github-actions-my-consultorio-front" -f ~/.ssh/my_consultorio_front_deploy
```

Adicione a chave publica em `~/.ssh/authorized_keys` na VPS e salve a chave privada em `VPS_SSH_KEY` no GitHub.

## 6. Primeira configuracao da VPS

```bash
sudo apt update
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo mkdir -p /var/www/my-consultorio-front
sudo chown -R $USER:$USER /var/www/my-consultorio-front
git clone git@github.com:SEU_USUARIO/my-consultorio-front.git /var/www/my-consultorio-front/my-consultorio
```

Configure o `.env` real na VPS:

```bash
cd /var/www/my-consultorio-front/my-consultorio
cp .env.example .env
nano .env
```

Build inicial:

```bash
npm ci
npm run build
```

## 7. Nginx

Use o exemplo:

```bash
sudo cp deploy/nginx/my-consultorio.conf.example /etc/nginx/sites-available/my-consultorio
sudo ln -s /etc/nginx/sites-available/my-consultorio /etc/nginx/sites-enabled/my-consultorio
sudo nginx -t
sudo systemctl reload nginx
```

O Nginx:

- serve `dist`;
- encaminha `/api` para o backend;
- usa fallback SPA para `index.html`;
- suporta subdominios de tenants;
- aplica gzip e headers basicos.

Configure HTTPS antes de liberar para clientes.

## 8. Workflow GitHub Actions

Arquivo:

```text
.github/workflows/deploy-frontend.yml
```

Fluxo:

1. checkout;
2. Node.js 20;
3. `npm ci`;
4. `npm run lint`;
5. `npx tsc -b --pretty false`;
6. `npm run build`;
7. SSH na VPS;
8. `git pull --ff-only`;
9. `npm ci`;
10. `npm run build`;
11. copia `dist` para `FRONTEND_DIST_PATH`, se configurado;
12. valida e recarrega Nginx.

## 9. Checklist de seguranca

- `.env` fora do Git.
- chave SSH exclusiva para GitHub Actions.
- usuario de deploy com permissao minima.
- `VITE_API_URL` apontando para `/api` em producao.
- HTTPS ativo.
- Nginx validado com `nginx -t`.
- sem URLs `localhost` no `.env` de producao.

## 10. Rollback simples

```bash
cd /var/www/my-consultorio-front/my-consultorio
git log --oneline -5
git checkout SHA_ANTERIOR
npm ci
npm run build
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Validacao local

```bash
npm run lint
npx tsc -b --pretty false
npm run build
```
