# 中英文内容与 Life 地图

| 要修改的内容 | 文件 |
| --- | --- |
| 英文个人简介、首页近况 | `../data/home.yaml` |
| 中文简介、项目介绍、经历、获奖及会议说明 | `../data/zh.yaml` |
| 导航与按钮文字 | `../i18n/en.yaml`、`../i18n/zh.yaml` |
| 中文论文介绍 | `../content/publications/<论文目录>/index.zh.md` |
| 旅行地点、照片路径与中英文图注 | `../data/life.json` |
| 照片替换方法 | `../assets/media/life/README.md` |

英文页面保持原地址，中文页面在 `/zh/` 下。每个已发布页面都有对应版本；切换语言时保留当前页面、章节锚点和地图选中的地点、照片。

论文的正式英文标题、作者、期刊名和 DOI 保留原文，中文主要用于研究介绍和页面说明。中文文案独立维护，修改英文后如有内容变化，请同步调整对应中文。

Life 使用可旋转的 3D 地球，地点直接取 `data/life.json` 的 `[纬度, 经度]`，新增或移动地点不需要生成平面坐标。`node scripts/build-life-map.cjs` 仅用于更新地球国界与海岸线。照片与地球素材的维护说明分别在 `assets/media/life/README.md` 和 `assets/maps/earth/README.md`。

`data/` 目录只放 Hugo 支持的结构化数据文件（YAML、JSON、TOML、XML），使用说明请放在 `docs/`，以免中断网站构建。
