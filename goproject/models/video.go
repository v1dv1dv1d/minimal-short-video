package models

import "time"

// Video 视频表对应模型
type Video struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"user_id"`
	VideoPath     string    `json:"video_path"`
	CoverPath     string    `json:"cover_path"`
	Description   string    `json:"description"`
	Plays         int       `json:"plays"`
	LikesCount    int       `json:"likes_count"`
	CommentsCount int       `json:"comments_count"`
	CreatedAt     time.Time `json:"created_at"`
}
