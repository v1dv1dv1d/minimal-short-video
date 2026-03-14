package database

import (
	"database/sql"
	"fmt"
	"log"

	"douyin/backend/config"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

// DSN 构建 MySQL 连接串
func dsn() string {
	pass := config.DB.Password
	if pass != "" {
		pass = ":" + pass
	}
	return fmt.Sprintf("%s%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
		config.DB.User, pass, config.DB.Host, config.DB.Port, config.DB.Database)
}

// Init 初始化数据库连接并执行建表
func Init() error {
	// 先连无库名 DSN 创建数据库
	baseDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/?parseTime=true&charset=utf8mb4",
		config.DB.User, config.DB.Password, config.DB.Host, config.DB.Port)
	conn, err := sql.Open("mysql", baseDSN)
	if err != nil {
		return fmt.Errorf("open mysql base: %w", err)
	}
	_, _ = conn.Exec("CREATE DATABASE IF NOT EXISTS " + config.DB.Database + " DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
	_ = conn.Close()

	DB, err = sql.Open("mysql", dsn())
	if err != nil {
		return fmt.Errorf("open mysql: %w", err)
	}
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("ping mysql: %w", err)
	}
	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(5)

	if err = ensureTables(); err != nil {
		return err
	}
	seedDefaultUser()
	log.Println("database connected and schema ready")
	return nil
}

func ensureTables() error {
	var err error
	for _, q := range []string{
		`CREATE TABLE IF NOT EXISTS users (
		    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
		    username VARCHAR(64) NOT NULL,
		    password_hash VARCHAR(255) NOT NULL,
		    avatar VARCHAR(512) DEFAULT '',
		    bio VARCHAR(512) DEFAULT '',
		    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		    UNIQUE KEY uk_username (username)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS videos (
		    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
		    user_id BIGINT UNSIGNED NOT NULL,
		    video_path VARCHAR(512) NOT NULL,
		    cover_path VARCHAR(512) DEFAULT '',
		    description VARCHAR(1000) DEFAULT '',
		    plays INT UNSIGNED DEFAULT 0,
		    likes_count INT UNSIGNED DEFAULT 0,
		    comments_count INT UNSIGNED DEFAULT 0,
		    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		    KEY idx_user_id (user_id),
		    KEY idx_created_at (created_at),
		    CONSTRAINT fk_videos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS video_likes (
		    user_id BIGINT UNSIGNED NOT NULL,
		    video_id BIGINT UNSIGNED NOT NULL,
		    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		    PRIMARY KEY (user_id, video_id),
		    KEY idx_video_id (video_id),
		    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		    CONSTRAINT fk_likes_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
		`CREATE TABLE IF NOT EXISTS follows (
		    follower_id BIGINT UNSIGNED NOT NULL,
		    following_id BIGINT UNSIGNED NOT NULL,
		    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		    PRIMARY KEY (follower_id, following_id),
		    KEY idx_following_id (following_id),
		    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
		    CONSTRAINT fk_follow_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
	} {
		if _, err = DB.Exec(q); err != nil {
			return fmt.Errorf("exec schema: %w", err)
		}
	}
	return nil
}

// seedDefaultUser 若没有任何用户，则插入默认账号，便于首次登录
func seedDefaultUser() {
	var n int
	err := DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&n)
	if err != nil {
		log.Printf("seed default user: 查询用户数失败，跳过: %v", err)
		return
	}
	if n > 0 {
		log.Printf("seed default user: 已有 %d 个用户，跳过创建默认账号", n)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("seed default user: bcrypt 失败: %v", err)
		return
	}
	_, err = DB.Exec("INSERT INTO users (username, password_hash, bio) VALUES (?, ?, ?)",
		"admin", string(hash), "默认账号，首次登录后可修改资料")
	if err != nil {
		log.Printf("seed default user: 插入失败: %v", err)
		return
	}
	log.Println("seed: 已创建默认账号 (用户名: admin, 密码: 123456)")
}

// Close 关闭数据库连接
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
