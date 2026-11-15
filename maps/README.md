# 地图数据

`world-map.json` 是站点地图插件的唯一基础素材，由 `webfilesproject` 仓库的
`scripts/build-map-data.mjs` 从 Natural Earth 1:10m Admin-1 数据生成。

文件采用混合缩进，便于直接阅读和改色：

- `meta`、`countries`、`divisions`：逐字段换行
- `arcs`、`graticule`：每 12 个数字换行
- `polygons`：每个一级行政区的弧段引用保持在一行

## 顶层字段

| 字段 | 含义 |
|------|------|
| `meta` | 标题、投影、量化后的世界宽高、国家数、行政区数、来源与许可 |
| `countries[]` | 国家：三位代码 `code`、英文名 `name`、中文名 `nameZh`、国家色 `color`、标签点 `label`、包围盒 `bbox`、面积 `area`、国界弧段 `arcs`、下辖行政区 `divisions` |
| `divisions[]` | 一级行政区：`id`（国家代码 + 三位序号）、`country`、`name` / `nameZh`、`color`、`polygons` |
| `arcs[]` | 共享边界弧段；`[x, y, dx, dy, …]` 增量编码 |
| `coast[]` | 需要描边的海岸线弧段索引 |
| `borders[]` | 需要描边的国界弧段索引；行政区内部弧段不在其中 |
| `graticule[]` | 10° 经纬网，格式同 `arcs` |

## 坐标与多边形

`arcs` 中每条弧段是量化后的坐标。第一个点是绝对坐标，之后每个点是相对前一个点的
`dx, dy` 增量。渲染时会还原成完整折线。

`divisions[].polygons` 的结构是「多边形 → 环 → 有符号弧段引用」：

```json
"polygons": [[[12, -34, 35]]]
```

- 正数表示正向使用 `arcs[i]`
- 负数表示反向使用（`~i`，与 TopoJSON 一致）
- 相邻行政区共用同一条弧段，所以简化不会把地块撕开

## 修改颜色

每个一级行政区都有自己的 `color`，直接改十六进制值即可；国家记录里的 `color`
用于信息卡色块。改完刷新页面就能看到效果，不需要重新构建站点。

## 重新生成

在 `webfilesproject` 仓库执行：

```bash
npm run build:map-data
# 生成 .map-cache/world-map.json，复制到本目录后提交
```

数据来源：Natural Earth 1:10m Admin-1 States, Provinces（公有领域）。
