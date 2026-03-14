package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"douyin/backend/config"
	"douyin/backend/database"
	"douyin/backend/middleware"

	"github.com/gin-gonic/gin"
)

// Feed 首页视频流：GET /api/videos/feed，按创建时间倒序；带 token 时返回 liked
func Feed(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT v.id, v.video_path, v.cover_path, v.description, v.likes_count, v.comments_count, v.user_id,
		       u.username, IFNULL(u.avatar,'')
		FROM videos v
		JOIN users u ON u.id = v.user_id
		ORDER BY v.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "查询失败"})
		return
	}
	defer rows.Close()

	baseURL := getBaseURL(c)
	uploadDir := config.Server.UploadDir
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	currentUserID, _ := middleware.ParseToken(c.GetHeader("Authorization"))

	var list []VideoItem
	var ids []int64
	for rows.Next() {
		var id, userID int64
		var videoPath, coverPath, description, username, avatar string
		var likesCount, commentsCount int
		if err := rows.Scan(&id, &videoPath, &coverPath, &description, &likesCount, &commentsCount, &userID, &username, &avatar); err != nil {
			continue
		}
		if coverPath == "" {
			if rel, ok := ensureVideoCover(uploadDir, id, videoPath); ok {
				coverPath = rel
			}
		}
		videoURL := baseURL + "/" + videoPath
		coverURL := baseURL + "/" + coverPath
		if coverPath == "" {
			coverURL = defaultCoverURL()
		}
		list = append(list, VideoItem{
			ID:          strconv.FormatInt(id, 10),
			VideoURL:    videoURL,
			CoverURL:    coverURL,
			Author:      Author{ID: strconv.FormatInt(userID, 10), Name: username, Avatar: avatar},
			Description: description,
			Likes:       likesCount,
			Comments:    commentsCount,
		})
		ids = append(ids, id)
	}

	if currentUserID > 0 && len(ids) > 0 {
		likedSet := make(map[int64]bool)
		placeholders := make([]string, len(ids))
		args := make([]interface{}, 0, len(ids)+1)
		args = append(args, currentUserID)
		for i, id := range ids {
			placeholders[i] = "?"
			args = append(args, id)
		}
		q := "SELECT video_id FROM video_likes WHERE user_id = ? AND video_id IN (" + strings.Join(placeholders, ",") + ")"
		r, err := database.DB.Query(q, args...)
		if err == nil {
			defer r.Close()
			for r.Next() {
				var vid int64
				if r.Scan(&vid) == nil {
					likedSet[vid] = true
				}
			}
		}
		for i := range list {
			id, _ := strconv.ParseInt(list[i].ID, 10, 64)
			list[i].Liked = likedSet[id]
		}
	}

	c.JSON(http.StatusOK, list)
}

// GetVideo 单个视频：GET /api/videos/:id
func GetVideo(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的视频 ID"})
		return
	}

	var videoPath, coverPath, description, username, avatar string
	var userID int64
	var likesCount, commentsCount int
	err = database.DB.QueryRow(`
		SELECT v.video_path, v.cover_path, v.description, v.likes_count, v.comments_count, v.user_id,
		       u.username, IFNULL(u.avatar,'')
		FROM videos v
		JOIN users u ON u.id = v.user_id
		WHERE v.id = ?
	`, id).Scan(&videoPath, &coverPath, &description, &likesCount, &commentsCount, &userID, &username, &avatar)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "视频不存在"})
		return
	}

	baseURL := getBaseURL(c)
	videoURL := baseURL + "/" + videoPath
	coverURL := baseURL + "/" + coverPath
	if coverPath == "" {
		coverURL = defaultCoverURL()
	}
	c.JSON(http.StatusOK, VideoItem{
		ID:          idStr,
		VideoURL:    videoURL,
		CoverURL:    coverURL,
		Author:      Author{ID: strconv.FormatInt(userID, 10), Name: username, Avatar: avatar},
		Description: description,
		Likes:       likesCount,
		Comments:    commentsCount,
	})
}

// Like 点赞/取消点赞：POST /api/videos/:id/like（需鉴权），body 可选 {"action":"like"|"unlike"}
func Like(c *gin.Context) {
	userID := middleware.UserID(c)
	idStr := c.Param("id")
	videoID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "无效的视频 ID"})
		return
	}

	var body struct{ Action string `json:"action"` }
	_ = c.ShouldBindJSON(&body)
	action := body.Action
	if action == "" {
		action = "like"
	}

	if action == "unlike" {
		res, err := database.DB.Exec("DELETE FROM video_likes WHERE user_id = ? AND video_id = ?", userID, videoID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "操作失败"})
			return
		}
		if aff, _ := res.RowsAffected(); aff > 0 {
			_, _ = database.DB.Exec("UPDATE videos SET likes_count = likes_count - 1 WHERE id = ?", videoID)
		}
		c.JSON(http.StatusOK, gin.H{"message": "ok", "liked": false})
		return
	}

	res, err := database.DB.Exec("INSERT IGNORE INTO video_likes (user_id, video_id) VALUES (?, ?)", userID, videoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "操作失败"})
		return
	}
	if aff, _ := res.RowsAffected(); aff > 0 {
		_, _ = database.DB.Exec("UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?", videoID)
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok", "liked": true})
}
