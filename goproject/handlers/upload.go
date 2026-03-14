package handlers

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"douyin/backend/config"
	"douyin/backend/database"
	"douyin/backend/middleware"

	"github.com/gin-gonic/gin"
)

// extractFirstFrame 用 ffmpeg 从视频提取第一帧为 coverPath，成功返回 true
func extractFirstFrame(videoPath, coverPath string) bool {
	dir := filepath.Dir(coverPath)
	_ = os.MkdirAll(dir, 0755)
	// -vframes 1 取一帧，-q:v 2 质量，-y 覆盖
	cmd := exec.Command("ffmpeg", "-i", videoPath, "-vframes", "1", "-q:v", "2", "-y", coverPath)
	if err := cmd.Run(); err != nil {
		return false
	}
	_, err := os.Stat(coverPath)
	return err == nil
}

// ensureVideoCover 若该视频尚无封面，则从视频文件生成第一帧并更新 DB，返回相对路径；否则返回空
func ensureVideoCover(uploadDir string, videoID int64, videoPath string) (relCoverPath string, ok bool) {
	fullVideoPath := filepath.Join(uploadDir, filepath.FromSlash(videoPath))
	if _, err := os.Stat(fullVideoPath); err != nil {
		return "", false
	}
	coverName := fmt.Sprintf("covers/%d.jpg", videoID)
	fullCoverPath := filepath.Join(uploadDir, coverName)
	if !extractFirstFrame(fullVideoPath, fullCoverPath) {
		return "", false
	}
	rel := filepath.ToSlash(coverName)
	_, _ = database.DB.Exec("UPDATE videos SET cover_path = ? WHERE id = ?", rel, videoID)
	return rel, true
}

// UploadVideo 上传视频：POST /api/upload/video（需鉴权），multipart: file, description(可选）
func UploadVideo(c *gin.Context) {
	userID := middleware.UserID(c)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请选择视频文件"})
		return
	}
	description := strings.TrimSpace(c.PostForm("description"))

	uploadDir := config.Server.UploadDir
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "创建目录失败"})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".webm"
	}
	ts := time.Now().UnixMilli()
	saveName := fmt.Sprintf("videos/%d_%d%s", userID, ts, ext)
	savePath := filepath.Join(uploadDir, saveName)
	if err := os.MkdirAll(filepath.Dir(savePath), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "创建目录失败"})
		return
	}
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "保存文件失败"})
		return
	}

	relPath := filepath.ToSlash(saveName)
	coverName := fmt.Sprintf("covers/%d_%d.jpg", userID, ts)
	coverPath := filepath.Join(uploadDir, coverName)
	relCoverPath := ""
	if extractFirstFrame(savePath, coverPath) {
		relCoverPath = filepath.ToSlash(coverName)
	}

	res, err := database.DB.Exec(
		"INSERT INTO videos (user_id, video_path, cover_path, description, plays, likes_count, comments_count) VALUES (?, ?, ?, ?, 0, 0, 0)",
		userID, relPath, relCoverPath, description,
	)
	if err != nil {
		_ = os.Remove(savePath)
		if relCoverPath != "" {
			_ = os.Remove(coverPath)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "保存记录失败"})
		return
	}
	videoID, _ := res.LastInsertId()

	username, avatar, _, _ := middleware.GetUserByID(userID)
	baseURL := getBaseURL(c)
	videoURL := baseURL + "/" + relPath
	coverURL := defaultCoverURL()
	if relCoverPath != "" {
		coverURL = baseURL + "/" + relCoverPath
	}

	c.JSON(http.StatusOK, VideoItem{
		ID:          strconv.FormatInt(videoID, 10),
		VideoURL:    videoURL,
		CoverURL:    coverURL,
		Author:      Author{ID: strconv.FormatInt(userID, 10), Name: username, Avatar: avatar},
		Description: description,
		Likes:       0,
		Comments:    0,
	})
}
