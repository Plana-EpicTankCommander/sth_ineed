# 地图数据

地图插件支持多个按区域切分的数据文件。世界底图来自 Natural Earth 1:10m Admin-1，
中国大陆部分额外接入 DataV 行政区划的市级数据；均由 `webfilesproject` 仓库生成。
网页地图只绘制国界与海岸线，不显示市级边界；市级边界只在本地地图编辑器里显示。

## 可用文件

| 文件 | 范围 |
|------|------|
| `world-map.json` | 全球 250 个国家、10,248 个行政区；中国大陆 366 个市级 / 省直辖县级单元，美国 3,143 个县，俄罗斯 2,328 个区，香港为单一行政区 |
| `east-asia-map.json` | 中国、香港、澳门、日本、韩国、朝鲜、蒙古、台湾，共 8 个国家 / 486 个行政区；香港为单一行政区 |

`east-asia-map.json` 由 `scripts/build-region-map.mjs` 从世界数据裁剪生成，渲染方式与
`world-map.json` 完全相同。

中国大陆按地级市拆分；北京、天津、上海、重庆四个直辖市保持整个直辖市为一个区块。
香港、澳门、台湾仍使用 Natural Earth 的省级边界。

市级数据用于悬停、点击和本地编辑；网页渲染时不描市级边界，视觉上中国仍是一个完整的国家色块。
`meta.outlineCountries` 目前设为 `["CHN"]`，只用于把中国国界画得更清晰，不会带出市级边界。

文件采用混合缩进，便于直接阅读和改色：

- `meta`、`countries`、`divisions`：逐字段换行
- `arcs`、`graticule`：每 12 个数字换行
- `polygons`：每个行政区的弧段引用保持在一行

## 顶层字段

| 字段 | 含义 |
|------|------|
| `meta` | 标题、投影、量化后的世界宽高、国家数、行政区数、来源与许可；`outlineCountries` 指定需要加粗国界的国家 |
| `countries[]` | 国家：三位代码 `code`、英文名 `name`、中文名 `nameZh`、国家色 `color`、标签点 `label`、包围盒 `bbox`、面积 `area`、国界弧段 `arcs`、下辖行政区 `divisions` |
| `divisions[]` | 行政区：`id`（国家代码 + 三位序号）、`country`、`name` / `nameZh`、`color`、`polygons` |
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

每个行政区都有自己的 `color`，直接改十六进制值即可；国家记录里的 `color`
用于信息卡色块。

网页渲染默认**忽略行政区分色**，按国家 `color` 纯色填充。需要省份色差时，在
`<hoi4-map>` 上加 `show-province-shading="true"`，或使用本地地图编辑器打开色差开关。

## 重新生成

普通 Natural Earth 世界底图：

```bash
npm run build:map-data
```

带中国大陆市级精度的底图，需要先生成 `world-cities.simplified.topojson`，再从它构建：

```bash
# 1. 下载 DataV 城市边界，裁切到 Natural Earth 中国轮廓并清理缝隙
#    产物：.map-cache/china-cities-clean.geojson
# 2. 与 Natural Earth 非中国行政区合并
#    产物：.map-cache/world-divisions-cities.geojson
# 3. mapshaper 简化并输出 TopoJSON
node node_modules/mapshaper/bin/mapshaper \
  .map-cache/world-divisions-cities.geojson \
  -simplify 40% keep-shapes \
  -filter-fields adm1_code,name,name_zh,adm0_a3 \
  -o .map-cache/world-cities.simplified.topojson format=topojson

# 4. 用外部 TopoJSON 构建世界地图
$env:MAP_SKIP_SIMPLIFY='1'
$env:MAP_SIMPLIFIED='.map-cache/world-cities.simplified.topojson'
$env:MAP_OUT='.map-cache/world-map.json'
node scripts/build-map-data.mjs

# 5. 生成东亚区域
node scripts/build-region-map.mjs east-asia
```

`world-map.json` 的混合缩进格式由 `scripts/build-map-data.mjs` 的 `formatMapJson` 生成；
区域图当前使用普通 `JSON.stringify(..., null, 2)`。

数据来源：

- Natural Earth 1:10m Admin-1 States, Provinces（公有领域）
- 中国大陆市级边界：DataV / 阿里云行政区划数据（再分发前请自行确认许可）
