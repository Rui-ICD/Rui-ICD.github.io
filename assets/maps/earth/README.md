# 真实地球贴图

本目录使用 NASA 官方公开地球数据图，不含 AI 生成图、航旅纵横 Logo、他人航线或个人数据。

## 素材

- `blue-marble-day.jpg`：NASA Blue Marble: Next Generation，2004 年 7 月日间真彩色月合成，包含地形与海底地形阴影；5400 × 2700，2,308,798 bytes。
- `earth-topography.jpg`：同系列灰度高程图，可选作轻微凹凸效果；5400 × 2700，1,244,508 bytes。它不是 RGB 法线贴图。

两个文件均保留 NASA 下载的原始 JPEG 字节，没有本地裁剪、调色、锐化或 AI 修改。NASA 当前提供的全球 JPEG 原生分辨率为 5400 × 2700；若需要兼容最大纹理尺寸为 4096 的 GPU，可由网站图片资源管线生成 4096 × 2048 的等比版本，保留本目录原图。

贴图为 2:1 等经纬全球投影，北在上，赤道位于高度中点，格林尼治经线约位于宽度中点，左右边缘在 ±180° 经线接合。地球实际明暗应由三维渲染器的照明控制。

## 来源与署名

日间贴图：

- [NASA Blue Marble: Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/)
- [含地形与海底地形的全球下载页](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/)
- 作者：Reto Stöckli，NASA Earth Observatory / NASA Goddard Space Flight Center。
- 官方推荐署名：**NASA Earth Observatory**。

灰度高程：

- [NASA 地形及海底地形下载页](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/)
- NASA 图像制作署名：Jesse Allen，NASA Earth Observatory。
- 底层数据：General Bathymetric Chart of the Oceans（GEBCO），由 British Oceanographic Data Centre 提供。
- 推荐标注：**NASA Earth Observatory; elevation data: GEBCO / British Oceanographic Data Centre**。

[NASA Earth Science 影像使用说明](https://science.nasa.gov/earth/faq/#may-i-reuse-imagery-that-is-on-your-site)允许重复使用其未另外标注版权限制的影像，并请使用者给予 NASA 署名；本目录对应下载页未标注额外版权限制。此处没有将 NASA 素材误标为 Creative Commons 许可。详见 [NASA 媒体使用说明](https://www.nasa.gov/nasa-brand-center/images-and-media/)。

原始下载地址、文件尺寸、字节数和 SHA256 记录在 `sources.json`。NASA 名称和图像署名仅表示素材来源，不表示 NASA 对本网站或作者的背书。

## 航旅纵横视觉参考（只参考，不复制）

- [官方 App Store 页面](https://apps.apple.com/cn/app/id480161784)：开发者为 China Travelsky；官方介绍含“3D 飞行视频”。当前官方截图可参考深色底、蓝青色城市光点和细航网线，但不能单凭该截图声称存在可手动旋转的地球。
- [用户分享的 3D 飞行地图视频](https://www.bilibili.com/video/BV1io4y1N7u5/)：非官方录屏；球体采用真实卫星风格陆地纹理、深蓝海洋、浅色海岸和球面透视。
- [另一则用户飞行视频展示](https://www.bilibili.com/video/BV1KP41147HW/)：非官方录屏；可观察明亮蓝色弧线、发光落点以及连接地名标签的细引线。

这些页面仅供理解三维呈现，不下载或复制其中的 Logo、个人行程、个人航线、截图贴纸或其他视觉素材。本站地球使用本目录的 NASA 数据，并由网站实现原创的旋转、缩放和地点展示。
