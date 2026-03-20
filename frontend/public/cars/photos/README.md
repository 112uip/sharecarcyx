# 车辆封面实拍图（本地）

列表页优先加载本目录下的 **`CAR-001.jpg` ~ `CAR-008.jpg`**（与数据库车辆 ID 一致），为 **Wikimedia Commons** 上的实拍图（CC 许可，论文/演示请保留来源说明）。

## 如何生成这些图片

在项目根目录 `car share` 下执行（需能访问 `upload.wikimedia.org`，国内若失败可开代理后重试）：

```bash
npm run download-car-photos
```

成功后刷新前端即可看到真实照片；无需改代码。

## 手动放置

也可自行将 JPG 命名为 `CAR-001.jpg` ~ `CAR-008.jpg` 放入本目录。

| ID | 车型 |
|---|---|
| CAR-001 | BYD Dolphin |
| CAR-002 | Tesla Model 3 |
| CAR-003 | AION Y |
| CAR-004 | NIO ET5 |
| CAR-005 | Xpeng P7 |
| CAR-006 | Li Auto L8 |
| CAR-007 | Maybach S-Class |
| CAR-008 | Xiaomi SU7 |
