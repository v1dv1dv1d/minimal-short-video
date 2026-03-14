package main

import (
	"log"
	"net/http"
	"os"

	"douyin/backend/config"
	"douyin/backend/database"
	"douyin/backend/handlers"
	"douyin/backend/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	if err := database.Init(); err != nil {
		log.Fatalf("database init: %v", err)
	}
	defer database.Close()

	uploadDir := config.Server.UploadDir
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("mkdir uploads: %v", err)
	}

	r := gin.Default()

	// CORS：允许前端跨域
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// 静态文件：上传的视频/封面通过 /uploads/* 访问
	r.Static(config.Server.UploadURL, uploadDir)

	api := r.Group("/api")
	api.POST("/auth/login", handlers.Login)
	api.POST("/auth/register", handlers.Register)
	api.GET("/videos/feed", handlers.Feed)
	api.GET("/videos/:id", handlers.GetVideo)

	auth := api.Group("")
	auth.Use(middleware.RequireAuth)
	auth.GET("/auth/me", handlers.Me)
	auth.POST("/auth/logout", handlers.Logout)
	auth.GET("/user/profile", handlers.Profile)
	auth.GET("/user/videos", handlers.MyVideos)
	auth.POST("/upload/video", handlers.UploadVideo)
	auth.POST("/videos/:id/like", handlers.Like)

	addr := ":" + config.Server.Port
	log.Printf("server listen on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("run: %v", err)
	}
}