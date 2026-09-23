# SensorLab 实验室网站

保留运动点云首页主图，以简洁的白色页面展示研究、新闻、成员及加入信息。全站静态，无需访客登录，支持 GitHub Pages。

## 第一次发布

1. 将本项目上传到 `XKMar/SensorLab` 的 `main` 分支。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 在 **Actions → Publish SensorLab → Run workflow** 运行发布。
4. 等待工作流成功，访问 `https://xkmar.github.io/SensorLab/`。

上述网址为目标地址；首次工作流成功前不代表已经上线。此后修改内容并提交到 main 即自动发布。修改文件需要 GitHub 写入权限，访问网站无需登录。

## 发布一条新闻

在 GitHub 打开 `content/news/example.md`，复制内容。通过 **Add file → Create new file** 创建 `content/news/英文短标题.md`。标题可用中文，文件名使用小写英文字母、数字与连字符。

```markdown
---
title: 这里填写新闻标题
date: 2026-09-23
category: 研究进展
summary: 一句话介绍这条新闻。
published: true
link:
---
这里写新闻正文。

## 小标题

支持 **加粗**、列表、[文字链接](https://example.com)。
```

- `published: false` 是草稿，不在网页显示。只有明确设置为 `true` 才发布。
- `link:` 留空：点击标题打开站内正文。
- `link: https://...`：点击标题直接打开外部页面，如公众号或项目主页。
- 日期填写真实事件/发布日期，格式为 YYYY-MM-DD，新闻按日期倒序。
- 元数据每项一行。不支持多行 YAML、嵌套字段或行尾注释；长内容写在下面的 Markdown 正文。
- 使用 GitHub 的 **Preview** 查看正文，然后 **Commit changes** 保存；等待 Actions 成功即上线。

## 添加研究工作

复制 `content/research/` 中任一 `.md` 文件，修改标题、摘要、正文和排序。

```text
paper: https://论文网址
code: https://代码仓库
project: https://项目主页
image: assets/项目配图.png
```

无需的链接留空或删除。仅填写真实链接。`image` 可选，先将图片上传至 `assets/`。`order` 越小越靠前，首页展示前 3 项。

## 图片

在 GitHub 的 `assets/` 目录选择 **Add file → Upload files** 上传图片。在正文插入：

```markdown
![图片说明]({{base}}assets/experiment.jpg)
```

`{{base}}` 会自动适配文章所在目录，兼容 GitHub Pages 项目子路径。推荐图片不超过 2 MB。

## 名称、成员与联系方式

编辑 `content/site.json`。`email` 与 `affiliation` 为空时显示待补充状态。将 `members` 改成以下数组可发布成员信息（请替换示例，勿直接发布虚构资料）：

```json
[
  {"name":"真实姓名","role":"实际身份或职称","research":"研究方向","photo":"assets/member.jpg","url":"https://个人主页"}
]
```

照片和主页都可留空字符串；JSON 最后一项后不要加逗号。修改颜色和排版请编辑 `assets/style.css`。

## 本地构建

安装 Node.js 24，然后：

```sh
npm install
npm run build
```

输出在 `dist/`。可运行 `python -m http.server 8000 --directory dist` 预览。每次构建重新生成 dist，请不要直接修改该目录；页面正文始终编辑 content。

## 维护说明

- 内容作者为受信任的仓库维护者。Markdown 支持原始 HTML，请勿自动导入未经审查的外部 HTML。
- 链接按钮仅接受 HTTP(S) 地址；图片路径必须存在于 assets 内。
- 没有成员名单或新闻时显示简洁的空状态，不发布虚构成员、新闻或成果。
- `.openai/` 仅用于原 Sites 预览，不需要上传到 GitHub。

## 维护代表性论文

在 `content/publications.json` 中编辑论文条目，首页与研究页同步更新。分类由 `scripts/publications.cjs` 管理：`motion`（人体运动与身份理解）、`localization`（跨视角匹配与精确定位）、`physiology`（人体生理信号感知）、`world`（世界模型与动作理解）。

- `authors`：按正式论文顺序填写完整姓名；页面不标注通讯作者。
- `image`：上传至 `assets/publications/` 的论文方法图或结果图；`image_source` 记录来源。
- `url`：正式论文页；`pdf`：PDF 链接；`pdf_note`：预印本或访问权限说明；`code`：代码地址，尚未确认时填写空字符串。
- `type`：`article` 或 `inproceedings`。`venue`、`year`、`volume`、`number`、`pages`、`doi` 用于生成可展开及下载的 BibTeX。
- `id` 必须为不重复的英文小写标识。不要添加空链接或推测通讯作者。

首批为经官方论文页和原文核实的六篇代表论文，并非 Google Scholar 全量导出。BiFusion 按期刊卷期使用 2024 年（在线发表为 2023 年），PDF 指向作者预印本；MPANet PDF 指向出版社，可能需要机构权限。后续可继续添加新条目，无需改页面布局。
