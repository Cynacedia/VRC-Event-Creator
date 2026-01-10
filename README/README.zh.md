<h1 align="center">
  <img src="../electron/app.ico" alt="VRChat Event Creator" width="96" height="96" align="middle" />&nbsp;VRChat Event Creator
</h1>
<p align="center">
  <a href="https://github.com/Cynacedia/VRC-Event-Creator/releases">
    <img src="https://gist.githubusercontent.com/Cynacedia/30c5da7160619ca08933e7e3e92afcc3/raw/downloads-badge.svg" alt="Downloads" />
  </a>
</p>
<p align="center">
  <a href="../README.md">English</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文（简体）</a> |
  <a href="README.pt.md">Português</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.ru.md">Русский</a>
</p>
一款一体化的 VRChat 活动创建工具，告别重复配置。
为每个群组创建并保存活动模板，通过简单的周期规则生成即将到来的活动日期列表，并一键自动填充详情——适合快速安排每周聚会、观影会和社区活动。


<p align="center">
  <img src=".imgs/1MP-CE_CreationFlow-01-05-26.gif" width="900" alt="活动创建流程（从资料到发布）" />
</p>


## 功能
- 按群组的资料/模板，一键自动填充活动详情。
- 周期规则生成器：给出即将到来的活动日期列表，也可手动输入日期/时间。
- 活动自动化系统（实验性）：按资料规则自动发布活动。
- 群组日历活动创建向导。
- 即将到来的活动编辑视图（网格 + 编辑弹窗）。
- 主题工作室，内置预设并支持完整界面配色（支持 #RRGGBBAA）。
- 图库选择与图片 ID 上传。
- 最小化到系统托盘。
- 本地化与首次启动语言选择（en, fr, es, de, ja, zh, pt, ko, ru）。

## 下载
- 发布版：https://github.com/Cynacedia/VRC-Event-Creator/releases

## 隐私与数据存储
不会存储你的密码，仅缓存会话令牌。
应用文件存放在 Electron 用户数据目录中（在 设置 > 应用信息 中可查看）：

- `profiles.json`（资料模板）
- `cache.json`（会话令牌）
- `settings.json`（应用设置）
- `themes.json`（主题预设与自定义颜色）
- `pending-events.json`（自动化队列）
- `automation-state.json`（自动化跟踪）

你可以通过环境变量 `VRC_EVENT_DATA_DIR` 指定数据目录。
首次启动时，应用会尝试从项目目录导入现有的 `profiles.json`。

__**不要分享缓存文件或应用数据文件夹。**__

## 使用说明
- 开始创建前需要填写资料名称、活动名称和描述。
- 私有群组只能选择访问类型 = 群组。
- 活动时长格式为 DD:HH:MM，最长 31 天。
- 标签最多 5 个，语言最多 3 个。
- 图库上传限制：PNG/JPG、64-2048 px、文件小于 10 MB、每个账号最多 64 张。
- VRChat 限制每小时每人每群组创建 10 个活动。
- 活动自动化需要应用保持运行。错过的自动化可在「编辑活动」中管理。

## 故障排查
- 登录问题：删除 `cache.json` 后重新登录（使用设置 > 应用信息中显示的数据目录）。
- 找不到群组：你的账号需要在目标群组中具备日历访问权限。
- 频率限制：VRChat 可能限制活动创建。请等待并重试，多次失败时停止操作，不要反复点击刷新或创建按钮。
- 更新：有更新待处理时，部分功能会被限制。请下载并运行最新版本。

## 免责声明
- 本项目与 VRChat 无关，也未获得其认可。请自行承担风险。
- 语言为机器翻译，可能不准确，欢迎提交修正。

## 要求（从源代码构建）
- Node.js 20+（推荐 22.21.1）
- npm
- 拥有至少一个群组活动创建权限的 VRChat 账号
