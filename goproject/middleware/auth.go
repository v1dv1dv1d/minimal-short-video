package middleware

import (
	"net/http"
	"strings"

	"douyin/backend/config"
	"douyin/backend/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type claims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}

// ParseToken 解析 JWT，返回 userID；无效或缺失返回 0
func ParseToken(tokenStr string) (int64, bool) {
	if tokenStr == "" {
		return 0, false
	}
	tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")
	tok, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(config.Server.JWTSecret), nil
	})
	if err != nil || !tok.Valid {
		return 0, false
	}
	c, _ := tok.Claims.(*claims)
	return c.UserID, true
}

// RequireAuth 需要登录的中间件，将 user_id 写入 Context
func RequireAuth(c *gin.Context) {
	auth := c.GetHeader("Authorization")
	userID, ok := ParseToken(auth)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "未登录或 token 无效"})
		c.Abort()
		return
	}
	c.Set("user_id", userID)
	c.Next()
}

// UserID 从 Context 取当前用户 ID（需在 RequireAuth 之后使用）
func UserID(c *gin.Context) int64 {
	v, _ := c.Get("user_id")
	id, _ := v.(int64)
	return id
}

// IssueToken 签发 JWT
func IssueToken(userID int64) (string, error) {
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, &claims{
		UserID: userID,
	})
	return tok.SignedString([]byte(config.Server.JWTSecret))
}

// GetUserByID 从数据库取用户（仅 username, avatar, bio；avatar/bio 为 NULL 时转为空字符串）
func GetUserByID(id int64) (username, avatar, bio string, err error) {
	row := database.DB.QueryRow("SELECT username, IFNULL(avatar,''), IFNULL(bio,'') FROM users WHERE id = ?", id)
	err = row.Scan(&username, &avatar, &bio)
	return
}
