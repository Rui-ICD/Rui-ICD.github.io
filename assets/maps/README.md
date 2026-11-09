# Life 地图

- 地理数据来自 [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)，属公共领域；通过 `world-atlas@2.0.2` 获取。
- `world.svg` 使用 Natural Earth I 投影，由 `scripts/build-life-map.cjs` 生成。
- `data/life-map.json` 保存地点在这幅地图上的位置。地图、城市光点均在本地绘制，不请求外部地图瓦片。
- 新增地点后，在仓库根目录运行 `node scripts/build-life-map.cjs`。该生成步骤需要联网；网站运行不需要地图服务或 API key。
- 生成工具的完整许可证保存在本目录的 `*-LICENSE.txt` 文件中。
- 旅行照片的来源、授权说明和替换方法见 `assets/media/life/README.md`，与地图数据的许可分开。
