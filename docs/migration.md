# 数据库迁移说明

此文档说明从旧版（基于 sql.js 或手动导出 JSON）的数据迁移到当前 `better-sqlite3` 实现的步骤与注意事项。

## 自动迁移（首次启动）
- 应用在首次初始化数据库时会自动运行内置迁移器（`src/main/database/DatabaseMigrator.ts`）以创建并升级表结构。
- 之后会尝试自动检测用户数据目录下以下候选文件并尝试迁移：
  - `fnw-export.json`（推荐，由旧版本导出生成）
  - `fnw-sqljs.json`
  - `fnw-sqljs.sqlite`
  - `fnw-old.db`

若检测到 `.json` 文件，程序会尝试解析并将常见表的数据写入新的 sqlite 中；若检测到旧 sqlite 文件，程序会通过 `ATTACH` 方式尝试将常见表拷贝到新库中。迁移成功后，原始文件会被重命名为 `.migrated.TIMESTAMP`。

## 如果旧数据在内存（sql.js）中
旧版本若只在内存中运行（未导出为文件），请先在旧程序中使用“导出数据”功能生成 JSON 导出（示例文件名 `fnw-export.json`），然后将该文件放到应用用户数据目录（`app.getPath('userData')`）后启动新版应用以触发自动迁移。

## 回退与排查
- 若迁移失败，原始文件不会被删除（除非自动重命名为 `.migrated.*`），请检查应用日志（通常位于 `userData/logs`）以获取错误详情。
- 若需回退，可通过恢复备份的旧文件并启动旧版本应用。

## 开发与 CI 注意
- `better-sqlite3` 为原生模块，CI/构建环境需在 `postinstall` 中运行 `electron-builder install-app-deps` 或使用正确的 Node/Electron 匹配构建器。

更多细节见 `src/main/database/legacyMigrator.ts`
