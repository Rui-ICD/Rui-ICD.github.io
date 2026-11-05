# 活动照片

这些照片显示在 **Highlights → Conferences & talks** 页面中，原有文件位置和文件名保持不变。

把对应的照片放在这个文件夹内，按下表命名。加入文件后，页面会自动显示你的照片；没有照片时暂时显示已提亮的蚂蚁图。

| 文件名 | 对应照片 | 地点 |
| --- | --- | --- |
| `iscas-2025.jpg` | ISCAS 投影幕布前的合影 | 伦敦，英国 |
| `icassp-2026.jpg` | 你站在海报前 | 巴塞罗那，西班牙 |
| `icra-2026.jpg` | 主席开场，背后是大屏幕 | 维也纳，奥地利 |
| `akc-2025.jpg` | 分享最近研究、讲 PPT 的抓拍 | 新加坡，NUSS Kent Ridge Guild House |

照片可以直接保留原始横竖比例，网页完整显示，不裁剪合影、海报或屏幕。点击照片可打开大图。

如果照片是 PNG 或 WebP，不需要强行改成 `.jpg`：把原格式文件放进来，再修改 `data/activities.yaml` 中对应的 `image` 路径，例如：

```yaml
image: media/activities/icassp-2026.png
```

活动日期、文字和图注也在 `data/activities.yaml` 中。`photo_note` 是给你替换照片时看的备注，不会显示在网页上。`date` / `date_end` 是会议起止日期，不是照片拍摄日期。

ICASSP 的活动日期按当前官网的 2026 年 5 月 4–8 日记录；早期征稿文件与 IEEE 论文元数据中的 5 月 3–8 日不用于推定你的海报拍摄日期。

这些本地文件修改后，需要提交并推送到 GitHub，待 Pages 部署成功才会显示在线上网站。
