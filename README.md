# 依赖校准研究 · 项目进度

网站：<https://psychelzh.github.io/ai-reliance-calibration-tracker/>

**项目状态：申报／审批中（2026-11-02确认）。** 此仓库仅保存可公开的任务摘要与静态网页。正式周期和资源以批复为准。

## 更新任务

在[Issues](https://github.com/psychelzh/ai-reliance-calibration-tracker/issues)中更新。`task`标记纳入看板，`phase:*`归入阶段，`priority:P0/P1/P2`表示优先级。开始时加`status:doing`，等待时加`status:waiting`，受阻时加`status:blocked`；同一时间仅保留一个状态标签。验收后关闭Issue；撤销使用“not planned”，不计入有效任务分母。

Issue正文的`<!-- tracker:id=...;deps=... -->`记录稳定任务编号及前置依赖。新任务请使用模板并填写唯一编号；验收条件采用Markdown清单。新任务通常先加`task`、阶段和优先级标签；没有状态标签表示待开始。

页面打开／点击刷新时读取公开GitHub API。Issues状态变更和源文件推送会触发GitHub Actions重新部署，生成带时间的任务快照。API限流或连接失败时页面明确显示快照时间；无需浏览器本地存储或网页中的访问令牌。

正式立项后修改`data/project.json`的`status`、`statusNote`、`cycle`、`currentPhase`等。`weeks`和`roadmap`中的建议日程也需据实际安排更新。当前阶段字段是人工确认的管理状态，不根据任务关闭自动推定伦理或立项获批。

## 内容边界

不上传申请书全文、签名、行政联系方式、成员身份信息、题库及答案、招募／支付名单、原始行为数据、密钥或审批材料原件。公开任务完成依据只写摘要；内部附件留在受控工作区。私有本地项目历史不推送到本仓库。

## 本地预览

无需安装依赖。构建输出放在OneDrive以外，例如：

```powershell
python scripts/build_site.py --output C:\Users\liang\.codex\cache\basic-research-kickoff-20261102\preview
python -m http.server 8765 --bind 127.0.0.1 --directory C:\Users\liang\.codex\cache\basic-research-kickoff-20261102\preview
```

公开API限流时，本地构建可追加`--offline`使用版本库中的带日期快照。部署构建通过仓库令牌读取最新Issues；构建失败不会用过期状态冒充最新数据。构建只打包`index.html`、`assets/`和`data/`，不把脚本或其他文件发布到网站。

任务验收数属于管理指标，不代表研究整体完成比例，也不表示预期结果已得到支持。
