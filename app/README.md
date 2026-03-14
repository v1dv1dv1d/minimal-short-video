# 极简短视频

根据「极简短视频」设计稿生成的前端页面，支持全屏竖版视频、上下滑动切换、点赞/评论/分享与作者信息展示。

## 技术栈

- React 18 + TypeScript
- Vite 5
- CSS Modules

## 运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173 ，建议使用移动端模式或真机查看。

## 功能

- 全屏竖版视频播放（当前项自动播放，切换后暂停/播放）
- 上下滑动或鼠标滚轮切换视频
- 右侧操作栏：点赞（可切换状态）、评论数、分享
- 底部作者头像、昵称与文案
- 底部渐变遮罩与安全区域适配

## 与后端联调

前端已按「调用接口」方式预留与后端的对接，无后端时自动使用 mock 数据。

1. **配置后端地址**  
   在项目根目录新建 `.env`（可复制 `.env.example`），设置：
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```
   重启 `npm run dev` 后，请求会发往该地址。

2. **接口约定**  
   所有请求封装在 `src/api/` 下，类型定义在 `src/api/types.ts`。后端需实现的大致接口如下（路径与入参/出参以代码为准）：
   - **登录** `POST /api/auth/login`  Body: `{ account, password }` → `{ token, user }`
   - **登出** `POST /api/auth/logout`（可选，请求头带 `Authorization: Bearer <token>`）
   - **当前用户** `GET /api/auth/me` → `User`
   - **视频流** `GET /api/videos/feed` → `VideoItem[]`
   - **用户资料** `GET /api/user/profile` → `User`
   - **用户作品** `GET /api/user/videos` → `UserVideoItem[]`
   - **上传视频** `POST /api/upload/video`  FormData: `file`, 可选 `description` → `VideoItem`

3. **鉴权**  
   登录成功后前端将 `token` 存于 localStorage（key: `stitch_token`），之后请求会在 Header 中带上 `Authorization: Bearer <token>`。

## 自定义

- 视频数据：未配置后端时由 `src/api/videos.ts` 的 mock 提供；配置后端后由接口返回。
- 样式：各页面与组件的 `*.module.css`。
