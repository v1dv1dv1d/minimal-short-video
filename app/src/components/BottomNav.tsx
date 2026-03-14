import { Link, useLocation } from 'react-router-dom'
import styles from './BottomNav.module.css'

const navItems: Array<{ path: string; icon: string; label: string; center?: boolean }> = [
  { path: '/', icon: 'home', label: '首页' },
  { path: '/discover', icon: 'explore', label: '发现' },
  { path: '/add', icon: 'add_box', label: '', center: true },
  { path: '/inbox', icon: 'notifications', label: '消息' },
  { path: '/profile', icon: 'person', label: '我的' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      {navItems.map(({ path, icon, label, center }) => {
        const isActive = location.pathname === path
        return (
          <Link
            key={path}
            to={path}
            className={styles.link}
            aria-current={isActive ? 'page' : undefined}
          >
            {center ? (
              <span className={styles.centerBtn}>
                <span className={`material-symbols-outlined ${styles.centerIcon}`}>
                  add
                </span>
              </span>
            ) : (
              <>
                <span
                  className={`material-symbols-outlined ${isActive ? 'material-symbols-fill' : ''} ${styles.icon}`}
                >
                  {icon}
                </span>
                {label && <span className={styles.label}>{label}</span>}
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
