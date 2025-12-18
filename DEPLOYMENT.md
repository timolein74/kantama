# Kantama.fi - Deployment-ohjeet

## 🚀 Nopea asennus VPS:lle (Hetzner/DigitalOcean)

### 1. Hanki VPS-palvelin

Suositus: **Hetzner Cloud CX21** (~4€/kk)
- 2 vCPU, 4GB RAM, 40GB SSD
- Ubuntu 22.04

### 2. Osoita domain palvelimelle

DNS-asetukset (esim. Cloudflare):
```
A     kantama.fi      -> [PALVELIMEN_IP]
A     www.kantama.fi  -> [PALVELIMEN_IP]
```

### 3. Asenna palvelin

SSH-yhteys palvelimelle:
```bash
ssh root@[PALVELIMEN_IP]
```

Asenna Docker:
```bash
# Päivitä järjestelmä
apt update && apt upgrade -y

# Asenna Docker
curl -fsSL https://get.docker.com | sh

# Asenna Docker Compose
apt install docker-compose-plugin -y

# Luo käyttäjä
adduser kantama
usermod -aG docker kantama
```

### 4. Lataa sovellus

```bash
su - kantama
git clone https://github.com/SINUN_REPO/kantama.git
cd kantama
```

### 5. Konfiguroi ympäristömuuttujat

```bash
# Luo .env tiedosto
cat > .env << 'EOF'
# Tietokanta
DB_PASSWORD=erittain_vahva_salasana_tahan

# JWT Secret (generoi uusi!)
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# Sähköposti (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@kantama.fi
SMTP_PASSWORD=gmail_app_salasana
SMTP_FROM_EMAIL=noreply@kantama.fi
SMTP_FROM_NAME=Kantama
ADMIN_EMAIL=admin@kantama.fi

# Frontend
FRONTEND_URL=https://kantama.fi
EOF
```

### 6. Hanki SSL-sertifikaatti

Ensimmäinen käynnistys ilman SSL:ää (Let's Encrypt):
```bash
# Luo väliaikaiset sertifikaatit
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=kantama.fi"

# Käynnistä
docker compose up -d

# Hanki oikeat sertifikaatit
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d kantama.fi -d www.kantama.fi \
  --email admin@kantama.fi --agree-tos

# Kopioi sertifikaatit
cp certbot/conf/live/kantama.fi/fullchain.pem nginx/ssl/
cp certbot/conf/live/kantama.fi/privkey.pem nginx/ssl/

# Käynnistä uudelleen
docker compose restart nginx
```

### 7. Käynnistä tuotannossa

```bash
docker compose up -d --build
```

---

## 📧 Sähköpostin konfigurointi

### Gmail App Password

1. Mene: https://myaccount.google.com/security
2. Ota käyttöön **2-vaiheinen vahvistus**
3. Luo **App Password** (Sovelluksen salasana)
4. Käytä tätä salasanaa SMTP_PASSWORD:ina

### Vaihtoehtoiset sähköpostipalvelut

**SendGrid** (ilmainen 100 viestiä/pv):
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxx
```

**Mailgun** (5000 viestiä/kk ilmaiseksi):
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.kantama.fi
SMTP_PASSWORD=xxxxx
```

---

## 🔧 Ylläpito

### Lokien tarkastelu
```bash
docker compose logs -f backend
docker compose logs -f nginx
```

### Tietokannan varmuuskopiointi
```bash
docker compose exec db pg_dump -U kantama kantama > backup_$(date +%Y%m%d).sql
```

### Päivitys
```bash
git pull
docker compose up -d --build
```

### Sertifikaatin uusiminen (automaattinen)
Certbot-kontti uusii sertifikaatit automaattisesti.

---

## 🔒 Turvallisuus

### Firewall (ufw)
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### Fail2ban (suojaa brute-force hyökkäyksiltä)
```bash
apt install fail2ban -y
systemctl enable fail2ban
```

---

## ❓ Ongelmatilanteet

### Sovellus ei käynnisty
```bash
docker compose logs backend
docker compose ps
```

### Tietokantaongelma
```bash
docker compose exec db psql -U kantama -c "SELECT 1"
```

### SSL-ongelma
```bash
docker compose logs nginx
openssl s_client -connect kantama.fi:443
```

---

## 📞 Tuki

Ongelmatilanteissa ota yhteyttä: admin@kantama.fi

