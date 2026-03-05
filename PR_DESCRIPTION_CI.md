# PR: ci: rebuild better-sqlite3 in workflow to avoid ABI mismatches

## 概要
在 CI workflow 中新增对 native 模块的重建步骤，确保 `better-sqlite3` 在不同 runner / Node ABI 下可用，避免因预编译二进制不匹配导致测试失败。

## 主要变更
- 修改：`.github/workflows/test.yml` — 在 `Install dependencies` 之后添加：

```yaml
- name: Rebuild native modules (ensure better-sqlite3 ABI match)
  run: |
    npm rebuild better-sqlite3 --build-from-source || true
  env:
    CI: true
```

## 验证步骤（PR 中运行 CI）
- CI 应在 ubuntu/windows runner 上通过全部测试（包括集成用例）。
- 若 CI 在 windows 报错，请在 runner 上确保已安装 MSVC / build tools（或在 workflow 中使用 setup-msbuild）。

## 注意事项
- 从源码构建可能增加 CI 时长，使用 `|| true` 可避免构建失败阻断流程，但建议观察日志并在必要时强制修复。
- 打包阶段仍需确认 electron-builder 对本机二进制的打包/解包配置（`asarUnpack` 等）。

## PR checklist
- [ ] 修改已提交并推送分支
- [ ] CI 运行并通过（ubuntu + windows + node 18/20）
- [ ] 若 windows runner 报错，补充 runner 构建工具或调整 workflow

---

本文件由自动化助手生成，用于快速复制粘贴到 PR 描述中。
