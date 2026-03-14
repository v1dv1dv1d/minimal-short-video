package handlers

import (
	"net/http"
	"strconv"

	"douyin/backend/config"
	"douyin/backend/database"
	"douyin/backend/middleware"

	"github.com/gin-gonic/gin"
)

// Profile 当前用户资料：GET /api/user/profile
func Profile(c *gin.Context) {
	userID := middleware.UserID(c)
	username, avatar, bio, err := middleware.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户不存在"})
		return
	}
	following, followers, likes := getProfileCounts(c, userID)
	c.JSON(http.StatusOK, userToResp(userID, username, avatar, bio, following, followers, likes))
}

// MyVideos 当前用户作品列表：GET /api/user/videos
func MyVideos(c *gin.Context) {
	userID := middleware.UserID(c)
	rows, err := database.DB.Query(
		"SELECT id, IFNULL(cover_path,''), plays, video_path FROM videos WHERE user_id = ? ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "查询失败"})
		return
	}
	defer rows.Close()

	var list []UserVideoItem
	baseURL := getBaseURL(c)
	uploadDir := config.Server.UploadDir
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	for rows.Next() {
		var id int64
		var coverPath, videoPath string
		var plays int
		if err := rows.Scan(&id, &coverPath, &plays, &videoPath); err != nil {
			continue
		}
		if coverPath == "" {
			if rel, ok := ensureVideoCover(uploadDir, id, videoPath); ok {
				coverPath = rel
			}
		}
		coverURL := baseURL + "/" + coverPath
		if coverPath == "" {
			coverURL = defaultCoverURL()
		}
		videoURL := baseURL + "/" + videoPath
		list = append(list, UserVideoItem{
			ID:       strconv.FormatInt(id, 10),
			CoverURL: coverURL,
			Plays:    formatCount(plays),
			VideoURL: videoURL,
		})
	}
	c.JSON(http.StatusOK, list)
}
