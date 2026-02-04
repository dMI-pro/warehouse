root@NL52191:/var/www/warehouse# chmod +x reset-vps.sh
root@NL52191:/var/www/warehouse# ./reset-vps.sh
🛑 Останавливаем контейнеры...
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] /var/www/warehouse/docker-compose.prod.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] down 5/5
 ✔ Container antiquar-proxy      Removed                                                                                                                                                0.3ss ✔ Container antiquar-minio      Removed                                                                                                                                                0.3ss ✔ Container antiquar-backend    Removed                                                                                                                                                10.3s ✔ Container antiquar-db         Removed                                                                                                                                                0.2s 
 ✔ Network warehouse_app-network Removed                                                                                                                                                0.1s 
🧹 Удаляем данные базы данных и MinIO (полный сброс)...
🚀 Запускаем контейнеры...
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] /var/www/warehouse/docker-compose.prod.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
[+] up 5/5
 ✔ Network warehouse_app-network Created                                                                                                                                                0.1ss ✔ Container antiquar-db         Healthy                                                                                                                                                11.1s ✔ Container antiquar-minio      Created                                                                                                                                                0.1ss ✔ Container antiquar-backend    Created                                                                                                                                                0.1ss ✔ Container antiquar-proxy      Created                                                                                                                                                0.0ss⏳ Ждем инициализации базы данных (10 сек)...
🔄 Применяем миграции...
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] /var/www/warehouse/docker-compose.prod.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "antiquar_db", schema "public" at "antiquar-db:5432"

7 migrations found in prisma/migrations

Applying migration `20251221223854_init`
Applying migration `20260102151231_add_warehouse_comittee_and_product_fields`
Applying migration `20260107100823_add_transaction_type`
Applying migration `20260107221939_add_return_products`
Applying migration `20260107235602_add_return_products_pc`
Applying migration `20260114025309_add_user_status`
Applying migration `20260118165902_add_sessions_revoke_at`

The following migration(s) have been applied:

migrations/
  └─ 20251221223854_init/
    └─ migration.sql
  └─ 20260102151231_add_warehouse_comittee_and_product_fields/
    └─ migration.sql
  └─ 20260107100823_add_transaction_type/
    └─ migration.sql
  └─ 20260107221939_add_return_products/
    └─ migration.sql
  └─ 20260107235602_add_return_products_pc/
    └─ migration.sql
  └─ 20260114025309_add_user_status/
    └─ migration.sql
  └─ 20260118165902_add_sessions_revoke_at/
    └─ migration.sql

All migrations have been successfully applied.
🌱 Заполняем базу тестовыми данными (Seed)...
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] /var/www/warehouse/docker-compose.prod.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
WARN[0000] The "G" variable is not set. Defaulting to a blank string. 
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
WARN[0000] The "G" variable is not set. Defaulting to a blank string.
/root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:859
    return new TSError(diagnosticText, diagnosticCodes, diagnostics);
           ^
TSError: ⨯ Unable to compile TypeScript:
error TS5109: Option 'moduleResolution' must be set to 'NodeNext' (or left unspecified) when option 'module' is set to 'NodeNext'.

    at createTSError (/root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:859:12)
    at reportTSError (/root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:863:19)
    at /root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:1379:34
    at Object.compile (/root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:1451:13)
    at Module.m._compile (/root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:1617:30)
    at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
    at Object.require.extensions.<computed> [as .ts] (/root/.npm/_npx/1fd1ec25c474d9d8/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1266:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1091:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12) {
  diagnosticCodes: [ 5109 ]
}
root@NL52191:/var/www/warehouse# 