# Life 地球的地理数据

- 地球贴图与高程图在 `earth/`，使用 NASA Blue Marble 官方数据；来源、署名及原文件 SHA256 见该目录说明。
- `globe-borders.json` 提供国界及海岸线，数据来自公共领域的 [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)，通过 `world-atlas@2.0.2` 获取。
- `globe-labels.json` 是辅助理解地形的中英文地理标签，不代表访问记录；实际足迹由 `data/life.json` 单独维护。
- 边界由 `scripts/build-life-map.cjs` 生成，在 3D 球面上作为单独的线条几何体绘制。无需外部地图瓦片或 API key。
- 新增或移动城市只需更新经纬度，不用再运行地图脚本。只有更新地理底图时，才运行 `node scripts/build-life-map.cjs`。
- 构建工具的完整许可证保存在本目录 `*-LICENSE.txt`；浏览器运行库的完整许可位于 `assets/vendor/globe/THIRD-PARTY-NOTICES.txt`。旧版 SVG 平面地图已移除。
- 旅行照片及逐张许可见 `assets/media/life/README.md`，与 NASA 地球贴图分开维护。
