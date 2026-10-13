# GitHub 手机版连接 WorkBuddy 步骤清单

适用：手机浏览器 / WorkBuddy App 内打开 GitHub 授权失败时用。

> **状态更新**：
> - ✅ 你的账号 `zzzyx6688` 的邮箱 `z1yhhhx888@163.com` **已验证**，且已是「主要电子邮箱」→ **「邮箱未验证」排除**（据 11:21 截图）。
> - ✅ 账号名已确认就是同一个：`zzzyx6688` = 之前 OAuth 页的 `zzyyx6688`（用户确认，疑似此前读取笔误）→ **「账号不一致」排除**。
> - ⚠️ 头号嫌疑转为 **2FA 未开** 与 **手机 App 内 WebView 丢登录态**。
> - 直接跳 **「方案 B：PAT」** 是最快、最稳的解法。

---

## 账号名不一致 — 已排除 ✅

用户已确认 `zzzyx6688` 与之前 OAuth 页的 `zzyyx6688` 是同一个账号（疑似此前读取笔误）。此条无需再查。

---

## 方案 A：邮箱验证 ✅ 已完成

你已完成，无需再操作。留档备查：

1. ~~Settings → Emails 看是否 `Verified`~~ → **已 `Verified`** ✅
2. ~~Resend → 邮箱点 Verify~~ → 不需要了

---

## 方案 A-2：开启两步验证（2FA）

未开 2FA 的账号 OAuth 也可能被中断。**截图未覆盖此页，请去确认。**

1. Settings → 左侧 **Password and authentication**
   （或开 `github.com/settings/two_factor_authentication`）
2. 找到 **Two-factor authentication** → 点 **Enable**
3. 选验证方式：推荐 **Authenticator app**（手机验证器 App 扫码），或短信
4. 按提示保存**恢复码（recovery codes）**到安全地方（丢了会锁账号）
5. 完成开启后回到 WorkBuddy 重试

---

## 方案 B：改用 Personal Access Token（PAT，兜底必成）⭐ 最推荐

既然邮箱已验证、账号能登录，**直接用 PAT 一步到位，绕开所有 OAuth 问题**。

### 第一步：生成 PAT

1. 手机浏览器登录 GitHub（确认是 **`zzzyx6688`**），进 **Settings**
2. 最左侧底部点 **Developer settings**
3. 点 **Personal access tokens** → **Tokens (classic)**
4. 点 **Generate new token (classic)**
5. 填：
   - **Note**：随便写，如 `workbuddy-link`
   - **Expiration**：选 `No expiration`（不过期）或自定
   - **Select scopes**（勾选）：
     - ☑ `repo`（整组，含私有库读写）
     - ☑ `workflow`
     - ☑ `user`（读账号信息）
   - 可选：`admin:repo_hook`（如需 Webhook）
6. 拉到底点 **Generate token**
7. **立即复制那串 `ghp_……`** —— 只显示这一次，关掉就没了

> 安全：别复用之前那条 `ghp_...YftU3`，重新生成一条；生成后去 Tokens 列表把旧的那条 **Delete / Revoke** 掉。

### 第二步：在 WorkBuddy 手动配置

1. 打开 WorkBuddy（手机版 `workbuddy.cn` 或 App）
2. 进 **连接器 / 集成** 页面 → 找 **GitHub**
3. 选择 **手动配置 / 粘贴 Token**（不是 OAuth 授权按钮）
4. 把复制的 `ghp_……` 粘进 Token 输入框
5. 点 **验证 / 保存**
6. 显示已连接即可

> 若界面只有「授权」按钮没有手动配置入口，说明该端未开放 PAT 直填，那就只能走方案 A-2（2FA）+ 账号名核对把 OAuth 修通，或换电脑端网页连接。

---

## 授权重试

做完上面任一步后：
1. WorkBuddy → GitHub 连接器 → **重新连接 / 连接**
2. 若跳 GitHub 授权页 → 用**手机系统浏览器（Chrome）**打开，别在 App 内 WebView 里点（避免丢登录态）
3. 确认授权页顶着的是 **`zzzyx6688`**（不是 `zzyyx6688`）
4. 看到 `Authorize` → 点确认
5. 回到 WorkBuddy 看是否显示「已连接」

---

## 快速排查优先级（更新版）

| 顺序 | 动作 | 为什么 |
|------|------|--------|
| ~~1~~ | ~~邮箱验证~~ | ✅ **已完成**，排除 |
| ~~2~~ | ~~账号名不一致~~ | ✅ **用户确认同一个**，排除 |
| **1** | **确认 2FA 是否开启** | 未开 2FA 的账号 OAuth 常被中断 |
| **2** | **直接上 PAT 手动配置** | 绕过 OAuth，最稳最快 |
| 3 | 检查 Authorized OAuth Apps | 看是否有卡住/重复的授权 |
| 4 | 用手机系统浏览器（Chrome）打开授权页 | 排除 App 内 WebView 丢登录态 |

---

> 和做视频无关：GitHub 连不连都不影响我们做视频（Remotion、ffmpeg、AI 生图都已验证可用），别为它卡住主任务。
