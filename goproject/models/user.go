package models

import "time"

// User 用户表对应模型
type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Avatar       string    `json:"avatar"`
	Bio          string    `json:"bio"`
	CreatedAt    time.Time `json:"-"`
	UpdatedAt    time.Time `json:"-"`
}
