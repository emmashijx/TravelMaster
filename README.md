# TravelMaster

TravelMaster 是一个中文旅行规划工具。同行成员可以在同一个空间里安排每日行程、记录支出，以及管理交通、住宿和门票预订。

## 功能

- 创建多趟旅行，按日期和时段查看行程。
- 记录金额、分类和付款人，并按币种汇总支出。
- 集中查看预订日期、订单号和确认状态。
- 已登录成员共享同一套旅行记录。保存或删除时会检查记录版本，避免覆盖其他成员刚提交的修改。

## 本地运行

需要 Node.js 22.13 或更高版本。首次运行时，安装锁定的依赖、构建站点，再初始化本地 Cloudflare D1 数据库。

```sh
cd sites/travelmaster
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lively_amphibian.sql
npm run dev -- --hostname 127.0.0.1
```

在开发服务器输出的地址上打开 `/signin-with-chatgpt?return_to=/`，以本地模拟账号进入旅行空间。初始迁移只需对同一个本地数据库执行一次。

## 仓库结构

| 路径 | 内容 |
| --- | --- |
| [`sites/travelmaster/app/`](sites/travelmaster/app/) | 旅行界面、登录辅助模块和记录 API |
| [`sites/travelmaster/db/`](sites/travelmaster/db/) · [`drizzle/`](sites/travelmaster/drizzle/) | D1 数据结构和 SQL 迁移 |
| [`sites/travelmaster/README.md`](sites/travelmaster/README.md) | Vinext、Cloudflare Worker 和 Sites 运行说明 |
| [`openspec/`](openspec/) | OpenSpec 配置与规格目录 |
| [`docs/chatgpt/`](docs/chatgpt/) | [「旅行网站原型 czech」对话存档](docs/chatgpt/czech-travel-website-prototype.md) |

旅行记录保存在运行环境的 D1 数据库中。托管版本通过 ChatGPT Sites 验证用户身份，空间成员共享数据，成员范围由站点的访问设置控制。
