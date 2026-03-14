package handlers

import (
	"net/http"
	"strings"

	"douyin/backend/database"
	"douyin/backend/middleware"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Login 登录：POST /api/auth/login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Account == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请填写账号和密码"})
		return
	}

	var id int64
	var passwordHash, username, avatar, bio string
	err := database.DB.QueryRow(
		"SELECT id, password_hash, username, IFNULL(avatar,''), IFNULL(bio,'') FROM users WHERE username = ?",
		req.Account,
	).Scan(&id, &passwordHash, &username, &avatar, &bio)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "账号或密码错误"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "账号或密码错误"})
		return
	}

	token, err := middleware.IssueToken(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "生成 token 失败"})
		return
	}

	following, followers, likes := getProfileCounts(c, id)
	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  userToResp(id, username, avatar, bio, following, followers, likes),
	})
}

// Me 当前用户：GET /api/auth/me（需鉴权）
func Me(c *gin.Context) {
	userID := middleware.UserID(c)
	username, avatar, bio, err := middleware.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户不存在"})
		return
	}
	following, followers, likes := getProfileCounts(c, userID)
	c.JSON(http.StatusOK, userToResp(userID, username, avatar, bio, following, followers, likes))
}

// Logout 登出：POST /api/auth/logout（可选，前端会清本地 token）
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

// Register 注册：POST /api/auth/register（便于首次使用创建账号）
func Register(c *gin.Context) {
	var req struct {
		Account  string `json:"account"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Account == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请填写账号和密码"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "加密失败"})
		return
	}
	_, err = database.DB.Exec(
		"INSERT INTO users (username, password_hash, avatar, bio) VALUES (?, ?, '', '')",
		req.Account, string(hash),
	)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate") {
			c.JSON(http.StatusConflict, gin.H{"message": "账号已存在"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "注册失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "注册成功，请登录"})
}
