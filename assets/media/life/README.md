# Life 地图照片

照片原文件在本文件夹下，按地点 ID 分组，例如：

- 伦敦：`london/tower-bridge.jpg`
- 维也纳：`vienna/belvedere.jpg`、`vienna/votivkirche.jpg`
- 南洋理工大学：`ntu-eee/ntu-eee.jpg`

地点名称、经纬度、照片路径以及中英文图注在仓库根目录的 `data/life.json` 中。经纬度顺序为 `[纬度, 经度]`。

## 替换成自己的照片

将自己的照片放入对应地点文件夹，并替换同名文件即可。如果文件名或格式改变，请同步更新 `data/life.json` 中对应照片的 `file` 路径。新增照片时，补充中英文 `alt` 和 `caption`，以说明地点或画面内容。

替换成自己拍摄的照片后，在该照片条目加上 `"author": "Rui Jiao"`，页面会随之更新摄影署名；将该条目的 `source_url` 改为 `""` 可以隐藏原站来源链接。如果全部照片都换成自己的，也可以统一把文件顶部 `photo_credit.name` 改为 `Rui Jiao`。只替换照片不需要重新生成地图。

目前 38 个地点的 42 张照片为经授权借用的临时展示素材，摄影者为 Yumin Zheng（Hanson-Zheng）。用户已于 2026-11-09 在对话中确认获得授权。页面展示须保留摄影者署名和来源链接，使用完整画面，保留照片中已有的水印、签名栏、Logo、网址及版权信息；请勿裁剪、修图、调色、添加滤镜或使用 AI 修改这些借用照片，也不要单独提取照片中的标识。

这些照片不代表 Rui Jiao 拍摄；图注只描述地点或地标，不包含他人的旅行日期、同行人、就学经历或个人故事。越南地点未纳入。

全部原始来源、文件大小、SHA256 校验值及授权依据记录在本目录的 `sources.json`。原作者完整素材声明见 [ASSET_LICENSE.md](https://github.com/hanson-zheng/hanson-zheng.github.io/blob/main/ASSET_LICENSE.md)。替换借用照片后，请同时调整来源记录和页面署名。
