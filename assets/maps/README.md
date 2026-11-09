# Life 地图

- 地理数据来自 [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)，属公共领域；通过 `world-atlas@2.0.2` 获取。
- `world.svg` 是 50m 分辨率的概览，`world-detail.svg` 是 10m 分辨率的高清地图，均使用 Natural Earth I 投影，由 `scripts/build-life-map.cjs` 生成。高清版本在放大时按需加载。
- 国界通过共享边界网格只绘制一次；缩放修改 SVG 的 viewBox，并使用 non-scaling-stroke，避免放大后线条变粗。地图上的光点独立放在屏幕坐标中，缩放不会改变标记大小或重启闪光动画。
- `data/life-map.json` 保存地点在这幅地图上的位置。地图、城市光点均在本地绘制，不请求外部地图瓦片。
- 新增地点后，在仓库根目录运行 `node scripts/build-life-map.cjs`。该生成步骤需要联网；网站运行不需要地图服务或 API key。
- 生成工具的完整许可证保存在本目录的 `*-LICENSE.txt` 文件中。
- 旅行照片的来源、授权说明和替换方法见 `assets/media/life/README.md`，与地图数据的许可分开。
