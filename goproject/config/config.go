package config

// DB 数据库配置
var DB = struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
}{
	Host:     "localhost",
	Port:     "3306",
	User:     "root",
	Password: "",
	Database: "test",
}

// Server 服务配置
var Server = struct {
	Port         string
	UploadDir    string
	UploadURL    string
	JWTSecret    string
}{
	Port:      "8081",
	UploadDir: "uploads",
	UploadURL: "/uploads",
	JWTSecret: "douyin-jwt-secret-change-in-production",
}
