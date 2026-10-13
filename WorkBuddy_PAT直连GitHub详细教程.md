# WorkBuddy 用 PAT 直连 GitHub · 详细教程

适用：手机端 WorkBuddy（国内版 workbuddy.cn）GitHub **OAuth 授权失败**时，改用 **Personal Access Token（PAT）手动配置**绕过。

> 已确认的前提（据你之前的截图/查询）：
> - 账号 `zzzyx6688` 的邮箱 `z1yhhhx888@163.com` **已验证** ✅
> - 你有一条 PAT `ghp_...YftU3`，通道已验证可正常访问 GitHub ✅
> - 失败原因大概率是「App 内 WebView 丢登录态 / 回调超时」，PAT 直连可绕开

---

## 整体流程（3 步）

```
① GitHub 生成 PAT  ──►  ② WorkBuddy 手动配置粘贴 PAT  ──►  ③ 验证已连接
```

若你**已有可用的 PAT**（就是 `ghp_...YftU3`），直接跳到 **第②步**。

---

## 第①步：在 GitHub 生成 PAT（手机浏览器）

> 若要用**新 token**（更安全，推荐），照做；想直接用旧的 `ghp_...YftU3` 就跳过这步。

1. 手机浏览器打开 **github.com**，登录 **`zzzyx6688`**
2. 点右上角**头像** → 点 **Settings**
3. 左侧最底部点 **Developer settings**
4. 点 **Personal access tokens** → 点 **Tokens (classic)**
5. 点右上角绿色按钮 **Generate new token (classic)**
6. 填写：
   - **Token name / Note**：写 `workbuddy-pat`（随便，便于识别）
   - **Expiration（有效期）**：下拉选
     - `No expiration`（不过期，最省事）
     - 或 `30 days` / `90 days`（到期需重生成）
7. **Select scopes（权限，务必勾够）**，展开勾选：
   - ☑ **repo**（整组，含私有库读写、fork）—— 最重要
   - ☑ **workflow**（如需让 agent 操作 Actions）
   - ☑ **user**（读你的账号信息，如用户名/邮箱）
   - 可选：`admin:repo_hook`（需要 Webhook 时）
   - *说明：`read:org` 可选，仅当你在组织里且需读组织信息*
8. 拉到页面最底部，点绿色 **Generate token**
9. **立即复制那串 `ghp_` 开头的字符** ⚠️ 只显示这一次，关掉页面就再也看不到了
   - 技巧：长按全选复制，避免漏字符；粘贴前检查首尾无空格/换行

> 安全：生成新 token 后，去 **Tokens (classic)** 列表，把旧的 `ghp_...YftU3` 点 **Delete / Revoke** 掉，避免暴露的旧 token 一直有效。

---

## 第②步：在 WorkBuddy 用 PAT 手动配置（手机端）

1. 打开 **WorkBuddy**（手机 App，或浏览器开 `workbuddy.cn` 网页版）
2. 找到连接器入口（不同版本叫法不同，依次试）：
   - 「**设置**」→「**集成 / 连接器 / 关联账号**」
   - 或「**个人中心**」→「**关联服务**」
   - 或底部「**我的**」→「**账号绑定**」
3. 在列表里找到 **GitHub**，点进去
4. ⭐ **关键：选「手动配置 / 使用个人访问令牌 / 粘贴 Token」入口**
   - **不要点「授权 / Authorize / 连接（OAuth）」按钮** —— 那会重新走失败的 OAuth 流程
   - 你要找的是带「Token / 令牌 / 手动」字样的输入框或模式切换
5. 在 **Token 输入框** 里粘贴刚才复制的 `ghp_...` 整串
6. 点 **验证 / 保存 / 连接**（按钮名随版本不同）
7. 等待 1–3 秒，出现 **「已连接 / 已授权 / 连接成功」**，并显示你的用户名 **`zzzyx6688`** → 成功 ✅

### 如果界面**只有「授权」按钮、没有手动配置入口**（你大概率正卡在这）

结合官方文档未收录、且你从一开始就找不到该入口，**当前手机版 WorkBuddy 很可能未开放 PAT 直填**，只有 OAuth 授权。先在当前页确认两件事：

- 页面上有没有 **「高级 / 更多 / ▾ 展开」** 这类可点开的小字或箭头？点开看是否藏着 Token 输入框。
- 有没有「使用令牌 / Use token / 高级登录」的切换链接？

若确认**真的没有**，走下面替代：

- **方案甲（推荐，最快拿到结果）**：不必强求 WorkBuddy 显示「已连接」。推送本来就能用你的 PAT 在沙箱直接做 —— 你回「直接推」，我立刻用 `ghp_...YftU3` 把工程 push 到 `zzzyx6688` 的公开仓库，效果等同，且不用 WorkBuddy 连接器。
- **方案乙**：想让 WorkBuddy 显示已连接 → 改用 **电脑端网页版** `workbuddy.cn` 重试（网页版功能常比 App 全，可能有 Token 入口或更稳的 OAuth）。
- **方案丙**：仍走 OAuth，但修机制问题：在**手机系统浏览器 Chrome** 里先**退出 GitHub** 重登 `zzzyx6688` → 回 WorkBuddy 点「授权」，授权页在 Chrome 打开（避开 App 内 WebView 丢 cookie）→ 点 `Authorize WorkBuddy` → 回看是否「已连接」。
- **方案丁**：你说过**国际版 WorkBuddy 已连 GitHub**，国际版那头本就能操作你的仓库，国内版连不上不影响你用 GitHub。

> 想让我精准判断你页面有没有隐藏入口？把**当前 GitHub 连接器那页截图**发我，我照着你的实际界面指路径。

---

## 第③步：验证连接成功

- 连接器页面 GitHub 显示 **「已连接」** 状态（带绿点/对勾）
- 显示绑定的用户名是 **`zzzyx6688`**（与我们预期一致）
- （可选）在 WorkBuddy 对话里试着说「列出我的 GitHub 仓库」，看 agent 能否读到

---

## 常见问题排障

| 现象 | 原因 | 解决 |
|------|------|------|
| 粘贴后提示「token 无效 / invalid」 | 复制不完整（漏字符 / 带空格换行）或已 revoke | 重新复制整串 `ghp_...`，首尾无空格；确认 token 未删 |
| 提示「权限不足 / insufficient scope」 | scope 没勾够 | 回去补勾 `repo` + `workflow` + `user` 后重新生成 |
| 有「授权」按钮但没手动配置入口 | 该端未开放 PAT 直填 | 换电脑端网页版，或走 OAuth+Chrome 方案乙 |
| 连接成功但 agent 读不到仓库 | 连接器授权范围受限 | 去 GitHub → Settings → Applications → 看 CodeBuddy/WorkBuddy 授权范围 |
| 连上后过几天失效 | token 设了有效期且到期 | 重新生成不过期的 token，或在到期前续期 |

---

## 连接完成后

连好后，回到对话告诉我 **「连上了」**，我会在沙箱里用你的 PAT：

1. 在你的 GitHub（`zzzyx6688`）下新建一个**公开仓库**
2. 把 `/workspace` 的视频工程整理（`git init` + `.gitignore` 排除 `node_modules` 等大依赖）
3. `commit` + `push` 上去
4. 写 README 说明每个工程怎么跑

> 公开仓库**不会**包含任何密钥——PAT 只存在于你的 GitHub 账户和本次会话，不写进仓库。

---

> 与做视频无关：GitHub 连不连都不影响我们做视频（Remotion、ffmpeg、AI 生图均已验证可用）。
