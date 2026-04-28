# ioshashiqi-quanx-checkin

哈士奇游戏 VIP 站点 Quantumult X 自动签到脚本。

## 特性
- 不在脚本内保存明文 cookie
- 通过 QuanX `script-request-header` 在你登录网页时自动抓取 cookie
- cookie 仅保存在 QuanX 本地存储
- 定时任务读取本地 cookie 自动签到
- 支持可选账号密码兜底登录（默认留空）

## 文件
- `ioshashiqi-checkin-quanx.js`：抓 cookie + 定时签到二合一脚本
- `quanx-import.conf`：单独导入片段

## 一键导入
### QuanX 真正一键导入（推荐）
- `quantumult-x:///add-resource?remote-resource=https%3A%2F%2Fraw.githubusercontent.com%2Feleven252412%2Fioshashiqi-quanx-checkin%2Fmain%2Fquanx-import.conf&tag=%E5%93%88%E5%A3%AB%E5%A5%87%E7%AD%BE%E5%88%B0&img-url=https%3A%2F%2Fraw.githubusercontent.com%2Fgithub%2Fexplore%2Fmain%2Ftopics%2Fquantumult-x%2Fquantumult-x.png`

### 原始配置文件链接
- `https://raw.githubusercontent.com/eleven252412/ioshashiqi-quanx-checkin/main/quanx-import.conf`

## QuanX 配置
### rewrite_local
```ini
[rewrite_local]
^https?:\/\/vip\.ioshashiqi\.com\/aspx3\/mobile\/.*\.aspx.*$ url script-request-header https://raw.githubusercontent.com/eleven252412/ioshashiqi-quanx-checkin/main/ioshashiqi-checkin-quanx.js
```

### task_local
```ini
[task_local]
10 8 * * * https://raw.githubusercontent.com/eleven252412/ioshashiqi-quanx-checkin/main/ioshashiqi-checkin-quanx.js, tag=哈士奇签到, enabled=true
```

## 使用步骤
1. 在 QuanX 添加上面的 `rewrite_local`
2. 登录 `https://vip.ioshashiqi.com/aspx3/mobile/login.aspx`
3. 登录后打开：
   - `https://vip.ioshashiqi.com/aspx3/mobile/usercenter.aspx?action=index`
   - 或 `https://vip.ioshashiqi.com/aspx3/mobile/qiandao.aspx`
4. 看到 `哈士奇 Cookie 抓取 / 成功 / 已保存到 QuanX 本地存档`
5. 再添加 `task_local` 定时任务

## 已确认链路
- 登录页：`/aspx3/mobile/login.aspx`
- 会员中心：`/aspx3/mobile/usercenter.aspx?action=index`
- 签到页：`/aspx3/mobile/qiandao.aspx`
- 状态接口：`/ashx/Honor.ashx`，参数 `control=list`
- 实际签到：对 `qiandao.aspx` 提交 ASP.NET postback：`__EVENTTARGET=_lbtqd`

## 常见通知
- 抓取：`哈士奇 Cookie 抓取 / 成功 / 已保存到 QuanX 本地存档`
- 命中：`哈士奇 Cookie 抓取 / 已命中页面 / 抓取脚本已命中当前页面，正在检查登录态 cookie`
- 保活：`哈士奇 Cookie 状态 / 仍有效 / 本地 cookie 未变化，今天已确认仍可读取`
- 诊断：`哈士奇 Cookie 抓取 / 未拿到完整登录态 / ...`
- 成功/已签：`哈士奇签到 / 签到成功 / 签到成功 | X | Y`（X=当次获得数量，Y=当前总数）
- 异常：`哈士奇签到 / 异常 / ...`，失败时保留详细诊断信息

## 敏感信息检查
发布版已移除：
- 明文 cookie
- 明文账号 / 密码默认值
- 本地绝对路径
- GitHub token

## License
MIT
