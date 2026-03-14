# 极简短视频后端 (Go)

与 `app` 前端配套的 Go 后端，提供用户、视频、点赞、上传等 API。

## 环境要求

- Go 1.21+
- MySQL 5.7+（localhost:3306，用户 root，无密码）
- **FFmpeg**（可选）：用于上传视频时自动截取第一帧作为封面；未安装时封面使用默认图。

## 配置

- 数据库：在 `config/config.go` 中修改 `DB`（默认 localhost:3306, root, 无密码, 库名 `douyin`）
- 服务端口：`config/config.go` 中 `Server.Port`（默认 8080）
- 上传目录：`Server.UploadDir`（默认 `uploads`），视频通过 `/uploads/*` 访问

## 数据库

首次运行时会自动创建数据库 `douyin` 及表：`users`、`videos`、`video_likes`、`follows`。也可手动执行 `database/schema.sql`。

## 运行

```bash
cd goproject
go mod tidy
go run main.go
```

服务地址：`http://localhost:8080`

## 前端对接

在 `app` 目录下配置环境变量后启动前端：

```bash
# .env 或 .env.local
VITE_API_BASE_URL=http://localhost:8080
```

## API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/me | 当前用户 | 是 |
| POST | /api/auth/logout | 登出 | 是 |
| GET | /api/videos/feed | 首页视频流（倒序） | 否 |
| GET | /api/videos/:id | 视频详情 | 否 |
| POST | /api/videos/:id/like | 点赞（body: {"action":"like"\|"unlike"}） | 是 |
| GET | /api/user/profile | 个人资料 | 是 |
| GET | /api/user/videos | 我的作品 | 是 |
| POST | /api/upload/video | 上传视频（multipart: file, description） | 是 |

鉴权：请求头 `Authorization: Bearer <token>`（登录接口返回的 token）。

## 首次使用

1. 启动 MySQL，确保 root 无密码可连。
2. 运行后端：`go run main.go`。
3. 调用 `POST /api/auth/register` 注册账号（或使用 Postman/curl）。
4. 使用该账号 `POST /api/auth/login` 登录，前端配置 `VITE_API_BASE_URL=http://localhost:8080` 后即可使用。
