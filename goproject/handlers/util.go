package handlers

import "strconv"

// formatCount 与前端一致：数字转 "1.2k" / "1.2w"
func formatCount(n int) string {
	if n >= 10000 {
		return strconv.FormatFloat(float64(n)/10000, 'f', 1, 64) + "w"
	}
	if n >= 1000 {
		return strconv.FormatFloat(float64(n)/1000, 'f', 1, 64) + "k"
	}
	return strconv.Itoa(n)
}
