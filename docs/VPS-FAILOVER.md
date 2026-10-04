# VPS failover — смена IP и переезд (сайт + VPN)

Инструкция для ИИ-агента (Cursor). Когда пользователь пишет «сценарий A» или «сценарий B»
(или «сменили IP» / «новый VPS») — **выполни соответствующий раздел целиком**, без лишних
уточнений, если ниже уже есть все дефолты.

DNS A-записи домена пользователь меняет **сам**. Агент DNS не трогает, только напоминает
проверить и ждёт подтверждения / проверяет резолв.

---

## Текущий прод (обновляй при смене хоста)

| Параметр | Значение |
|---|---|
| Сайт / домен | `https://tsehh.ru` (+ `www`) |
| SSH-алиас прод | `warehouse-vps` (правь `~/.ssh/config` HostName при смене IP) |
| Путь сайта | `/var/www/warehouse` |
| Compose | `docker-compose.prod.yml` |
| Ветка кода | `staging` |
| VPN порт | `8443/tcp` (если 443 занят сайтом) |
| Панель VPN | `8080/tcp` → `/opt/vpn-admin` |
| Xray конфиг | `/usr/local/etc/xray/config.json` |
| VPN data | `/opt/vpn-admin/data/` (`users.db`, `server.json`, …) |
| Секреты сайта | `.env`, `prod.env`, `backend/.env`, `frontend/.env` |
| SSL | `certs/`, `letsencrypt/` (+ запас `/root/ssl-keep/`) |
| Данные | `postgres_data/`, `minio_data/` |
| Cron | backup `15 3 * * *`, SSL renew `20 4 * * 0` (скрипты в `scripts-new/macos/`) |
| UFW open | `22`, `80`, `443`, `8443`, `8080` — **не** открывать `9000/9001` (MinIO слушает в Docker, снаружи закрыт) |

Telegram-бот VPN **не включать**. Чужие сервисы на VPS не трогать.

---

## Что пишет пользователь (триггеры)

| Сообщение пользователя | Действие агента |
|---|---|
| «сценарий A» / «сменили IP» / «новый IP у VPS» | § Сценарий A |
| «сценарий B» / «новый VPS» / «переезд» / «создал новый сервер» | § Сценарий B |
| В том же сообщении: новый IP и/или SSH (`root@IP` или алиас) | использовать сразу |
| «VPN не нужен» | сайт по инструкции; VPN шаги пропустить |
| «VPN нужен / сохранить ключи» | обязательно сохранить Reality keys + UUID (см. ниже) |

Минимум от пользователя при A: **новый IP** (и что DNS уже/скоро сменён).  
Минимум при B: **SSH на новый VPS** + доступ к старому (пока жив) **или** свежий офлайн-бэкап.

---

## Главное про VPN-ключи (оба сценария)

Чтобы **не раздавать людям новые UUID/Reality-ключи**, сохраняй и переноси:

1. `/usr/local/etc/xray/config.json` — Reality privateKey, shortIds, все client UUID  
2. `/opt/vpn-admin/data/users.db` — пользователи панели  
3. `/opt/vpn-admin/data/server.json` — keys/SNI/port (**после смены IP обновить только `server_ip`**)  
4. `/opt/vpn-admin/.env` — пароль панели (если есть)  
5. Опционально: `/root/vpn-admin-credentials.txt`, `/root/xray-client-info.txt`

**Нельзя** после переноса запускать «чистый» `deploy-vpn.sh` и оставлять его конфиги —
он сгенерирует **новые** ключи. Порядок: поставить бинарники/панель → **перезаписать**
конфиги из бэкапа → поправить `server_ip` → restart.

Клиентам после смены IP нужны ссылки с **новым IP**, но теми же UUID/`pbk`/`sid`.  
Если править адрес вручную в приложении — тоже достаточно (ключи те же).

Обновить только IP в `server.json` (без чтения секретов в чат):

```bash
ssh <target> 'python3 - <<"PY"
import json
from pathlib import Path
p = Path("/opt/vpn-admin/data/server.json")
d = json.loads(p.read_text())
d["server_ip"] = "NEW_IP_HERE"
p.write_text(json.dumps(d, indent=2) + "\n")
print("server_ip=", d["server_ip"], "port=", d.get("port"))
PY
systemctl restart vpn-admin-web'
```

Ссылки пользователям — из панели `http://NEW_IP:8080` (пароль из credentials), **не**
светить UUID/ключи в общем чате.

---

## Сценарий A — смена IP на том же VPS

Провайдер выдал новый IP, диск и сервисы на месте.

### A0. Входные данные

- Новый IP  
- SSH-алиас (обычно `warehouse-vps`) — обновить `HostName` в `~/.ssh/config`  
- DNS домена пользователь меняет сам на новый IP  

### A1. SSH и базовые проверки

```bash
ssh <target> 'curl -4 -fsS --max-time 5 ifconfig.me; echo
systemctl is-active xray vpn-admin-web docker cron
cd /var/www/warehouse && docker compose -f docker-compose.prod.yml ps
ufw status | head -20
ss -tlnp | grep -E ":80|:443|:8080|:8443|:9000|:9001"'
```

### A2. Сайт

Сайт завязан на домен, не на IP:

1. Дождаться/проверить DNS: `tsehh.ru` / `www` → новый IP (с самого VPS: `dig +short tsehh.ru A`).  
2. `https://tsehh.ru/` и `/api/health` → 200.  
3. Сертификат: `CN=tsehh.ru`, не expired.  
4. Если HTTPS не поднялся из‑за DNS/пропагации — подождать; не перевыпускать LE без нужды.  
5. Контейнеры обычно **не** пересобирать.

### A3. VPN (если нужен)

1. Прописать новый IP в `server.json` (команда выше).  
2. `systemctl restart vpn-admin-web` (xray обычно без изменений — слушает порт).  
3. Проверка: `systemctl is-active xray vpn-admin-web`, порт 8443/8080 слушают.  
4. Отдать пользователю: обновить IP в клиентах **или** новые `vless://` из панели (ключи те же).

### A4. UFW / облачный firewall

- UFW на сервере обычно без изменений.  
- **Важно:** в панели провайдера (Hostkey и т.п.) открыть на **новом IP** те же порты: 22, 80, 443, 8443, 8080.  
- MinIO 9000/9001 снаружи не открывать.

### A5. Готово — отчёт пользователю

- Новый IP, DNS OK?, сайт 200?, VPN IP обновлён?, что сказать клиентам VPN.

---

## Сценарий B — новый VPS (отмена старого)

Старый сервер уходит; нужен полный перенос сайта (+ VPN с теми же ключами, если нужен).

### B0. Входные данные

- SSH на **новый** VPS (`root@NEW` или алиас)  
- SSH на **старый** (пока жив) — предпочтительно  
- Если старый уже мёртв: путь к офлайн-бэкапу (см. § Офлайн-бэкап)  
- Пользователь сам поставит DNS на новый IP **после** готовности сайта (или заранее, понимая простой)

### B1. Анализ нового сервера

Как в `AGENTS.md`: OS, RAM, диск, `ss -tulnp`, ufw, docker, доступность GitHub.  
Не ломать чужие сервисы. Порт сайта — 80/443; VPN — 8443 если 443 займёт nginx/proxy.

### B2. Что копировать со старого (полный набор сайта)

Со старого `<old>` на новый `<new>` (через tar|ssh, без `rsync` если его нет):

**Обязательно:**

| Источник на старом | Назначение |
|---|---|
| Весь `/var/www/warehouse` **или** git clone + ниже | `/var/www/warehouse` |
| `.env`, `prod.env`, `backend/.env`, `frontend/.env` | те же пути |
| `certs/`, `letsencrypt/` | те же (+ желательно `/root/ssl-keep/`) |
| `postgres_data/`, `minio_data/` | те же (или restore из свежего бэкапа `backups-new`) |
| `docker-compose.prod.yml`, `nginx.conf`, `scripts-new/` | те же |

**VPN (если сохраняем ключи):**

| Источник | Назначение |
|---|---|
| `/usr/local/etc/xray/config.json` | тот же путь |
| `/opt/vpn-admin/data/` | целиком |
| `/opt/vpn-admin/.env` | тот же |
| `/root/vpn-admin-credentials.txt` | `/root/` |

Историю старых бэкапов тащить не обязательно, если переносятся живые `postgres_data` + `minio_data`
или один свежий restore.

Пример переноса дерева (сайт):

```bash
ssh <old> 'tar czf - -C /var/www warehouse' | ssh <new> 'mkdir -p /var/www && tar xzf - -C /var/www'
```

Если диск огромный — можно без `postgres_data`/`minio_data`/`backups-new`, а потом отдельно
или через dump. Предпочтительно **живые тома**, пока старый доступен.

### B3. Поднять сайт на новом

```bash
ssh <new> 'cd /var/www/warehouse && docker compose -f docker-compose.prod.yml up -d --build'
```

Проверки: контейнеры healthy, локально `https` с Host `tsehh.ru` → 200, `/api/health` → 200.

Права на `postgres_data` (обычно uid 70) не ломать (`tar` без смены владельца).

### B4. Cron + UFW на новом

```cron
15 3 * * * cd /var/www/warehouse && /usr/bin/env PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /bin/bash ./scripts-new/macos/backup-all-vps.sh
20 4 * * 0 cd /var/www/warehouse && /usr/bin/env PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /bin/bash ./scripts-new/macos/renew-ssl-vps.sh
```

UFW (как на прод): allow 22, 80, 443, 8443, 8080; default deny incoming; enable.  
9000/9001 **не** открывать.

### B5. VPN на новом с теми же ключами

1. Установить Xray + панель удобным способом (`deploy-vpn.sh` **или** пакеты из этого репо) — это даёт бинарники/systemd/venv.  
2. **Сразу перезаписать** `config.json` и `/opt/vpn-admin/data/` (+ `.env`) из старого.  
3. В `server.json` выставить **новый** IP.  
4. Порт: если сайт занял 443 — оставить **8443** (как в сохранённом конфиге). Не менять порт без нужды (иначе клиентам мало смены IP).  
5. `systemctl restart xray vpn-admin-web` && enable.  
6. Проверки: active, listen 8443/8080, логин панели 200.

Если VPN «пофигу» — шаг B5 пропустить; UFW 8443/8080 можно не открывать.

### B6. DNS и финал

1. Напомнить: A-записи `tsehh.ru` / `www` → новый IP.  
2. Проверить с нового VPS публичный HTTPS и API.  
3. Обновить SSH-алиас `warehouse-vps` → новый IP.  
4. Обновить таблицу «Текущий прод» в **этом файле**.  
5. Старый VPS не удалять, пока пользователь не подтвердил сайт (+ VPN).  
6. Отчёт: IP, сайт OK, VPN ключи сохранены/нет, что сделать клиентам.

---

## Офлайн-бэкап (если старый уже недоступен)

Держать вне VPS (Mac / объектное хранилище) актуальный архив:

```text
warehouse-env/          # .env prod.env backend/.env frontend/.env
warehouse-certs/        # certs/ + letsencrypt/
warehouse-data/         # postgres dump и/или tar postgres_data + minio_data
vpn-preserve/           # xray config.json + vpn-admin data/ + .env + credentials
```

Свежий DB+MinIO бэкап можно брать из `backups-new/` (скрипт `backup-all-vps.sh`).  
Без `letsencrypt/` воскресный renew может потребовать новый выпуск (сайт до истечения certs/ ещё жив).

---

## Чеклист «ничего не забыли» (сайт)

- [ ] Секреты: 4 env-файла  
- [ ] `certs/` + `letsencrypt/`  
- [ ] Данные postgres + minio (тома или restore)  
- [ ] `nginx.conf` + `docker-compose.prod.yml` под `tsehh.ru`  
- [ ] Cron backup + SSL  
- [ ] UFW 80/443 (+22); MinIO снаружи закрыт  
- [ ] DNS на новый IP  
- [ ] HTTPS 200 и данные на месте  

## Чеклист VPN (если нужен)

- [ ] Перенесён `config.json` (не сгенерирован заново)  
- [ ] Перенесён `users.db` + `server.json`  
- [ ] `server_ip` = новый IP  
- [ ] Порт тот же (обычно 8443)  
- [ ] xray + vpn-admin-web active  
- [ ] Клиентам — новый адрес/ссылки, **те же** ключи  

---

## Запреты

- Не коммитить `.env`, ключи, `users.db`, `vless://` в git.  
- Не светить пароли/UUID/Reality private key в чате.  
- Не останавливать чужие VPN/Docker на shared VPS.  
- Не открывать MinIO 9000/9001 в UFW «навсегда» без запроса.  
- Не делать `deploy-vpn.sh` финальным шагом без отката конфигов на сохранённые.
