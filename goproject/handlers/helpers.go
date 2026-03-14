package handlers

import (
	"strconv"

	"douyin/backend/config"
	"douyin/backend/database"

	"github.com/gin-gonic/gin"
)

func getProfileCounts(c *gin.Context, userID int64) (following, followers, likes string) {
	var f1, f2, l int
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM follows WHERE follower_id = ?", userID).Scan(&f1)
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM follows WHERE following_id = ?", userID).Scan(&f2)
	_ = database.DB.QueryRow("SELECT COALESCE(SUM(likes_count),0) FROM videos WHERE user_id = ?", userID).Scan(&l)
	return formatCount(f1), formatCount(f2), formatCount(l)
}

func userToResp(id int64, username, avatar, bio, following, followers, likes string) UserResp {
	return UserResp{
		ID:        strconv.FormatInt(id, 10),
		Username:  username,
		Avatar:    avatar,
		Bio:       bio,
		Following: following,
		Followers: followers,
		Likes:     likes,
	}
}

func getBaseURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	if host == "" {
		host = "localhost:" + config.Server.Port
	}
	return scheme + "://" + host + config.Server.UploadURL
}

func defaultCoverURL() string {
	return "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400"
}
