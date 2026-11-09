# Life 的城市风景

全部照片在本文件夹的 `landmarks/` 内，每个地点一张：

- 新加坡：`landmarks/singapore.jpg`
- 成都、运城：`landmarks/chengdu.jpg`、`landmarks/yuncheng.jpg`
- 郑州、昆明：`landmarks/zhengzhou.jpg`、`landmarks/kunming.jpg`
- 槟城、马六甲、怡保：`landmarks/penang.jpg`、`landmarks/melaka.jpg`、`landmarks/ipoh.jpg`

地点、经纬度、照片路径、中英文图注、摄影者、许可和来源在仓库根目录的 `data/life.json`。目前为 37 个地点、12 个国家；巴厘岛、岳阳、澳门及菲律宾的地点已移除。成都和运城保留原有条目，没有重复添加。

## 替换照片

1. 用自己的照片替换对应同名 JPG；若文件名或格式改变，也要修改 `data/life.json` 的 `photos[0].file`。
2. 同步更新 `alt`、`caption` 的中英文内容，以及 `author`、`license`、`license_url`、`source_url`。
3. 如改为自己的摄影，可在 author 填 Rui Jiao，并按你实际授予的许可填写。不要把现有摄影者的署名留在替换后的照片上。

## 当前素材与许可

这些是 Wikimedia Commons 上公开授权的真实城市风景参考图，不代表 Rui Jiao 拍摄。原先借用的 Yumin Zheng 照片已从网站移除。

原始下载文件没有本地调色、去水印或 AI 修改。风景集的小图会按版式缩放和裁切；点开可以看完整画面。图像及其缩略图分别遵循各自的 CC BY、CC BY-SA 或 CC0 许可，**不随仓库代码使用 MIT 许可**。页面中显示摄影署名、许可和来源；完整来源、标题、作者、下载地址和 SHA256 记录在 `sources.json`。

吉隆坡和马六甲两张须保留指定署名 **Photo by CEphoto, Uwe Aranas**。其他照片也请按逐张许可保留所需署名。

## 地图与标记

- 北京为端正的红色五角星，标示首都。
- 成都、运城、新加坡的 `marker` 为 `featured`，光芒更大；普通地点为 `light`。
- 经纬度顺序是 `[纬度, 经度]`。新增或移动地点后，运行 `node scripts/build-life-map.cjs`，更新地图位置。
- 地图有普通与高清两套本地矢量数据，放大时自动加载高清版本。滚轮围绕鼠标位置缩放，最高 512×；支持鼠标拖动、触屏拖动/双指缩放、键盘和全屏。
- “足迹地图 / 风景集”切换和所选城市会随中英文切换保留。风景集按地理位置组织，不虚构出行年份或先后顺序。
