package handlers

// 与前端 types 一致的 JSON 结构

// VideoItem 视频流单项（首页/详情）
type VideoItem struct {
	ID          string   `json:"id"`
	VideoURL    string   `json:"videoUrl"`
	CoverURL    string   `json:"coverUrl"`
	Author      Author   `json:"author"`
	Description string   `json:"description"`
	Likes       int      `json:"likes"`
	Comments    int      `json:"comments"`
	Liked       bool     `json:"liked,omitempty"` // 当前用户是否已点赞（仅 feed 带 token 时有效）
}

// Author 视频作者
type Author struct {
	ID     string `json:"id,omitempty"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

// UserResp 当前用户信息（登录后/个人页）
type UserResp struct {
	ID        string `json:"id,omitempty"`
	Username  string `json:"username"`
	Avatar    string `json:"avatar"`
	Bio       string `json:"bio"`
	Following string `json:"following"`
	Followers string `json:"followers"`
	Likes     string `json:"likes"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Account  string `json:"account"`
	Password string `json:"password"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string   `json:"token"`
	User  UserResp `json:"user"`
}

// UserVideoItem 个人页作品网格单项
type UserVideoItem struct {
	ID       string `json:"id"`
	CoverURL string `json:"coverUrl"`
	Plays    string `json:"plays"`
	VideoURL string `json:"videoUrl,omitempty"`
}
