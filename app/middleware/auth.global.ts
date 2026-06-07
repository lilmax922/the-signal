// DEV-AUTH-DISABLED: 全域路由守衛已停用,未登入也能存取所有頁面。
// 重新啟用:取消下方 /* … */ 區塊的註解。
export default defineNuxtRouteMiddleware((_to) => {
  // DEV-AUTH-DISABLED: see header comment above
  /*
  const user = useSupabaseUser()

  // Allow access to the OAuth callback page
  if (to.path === '/confirm') {
    return
  }

  // Redirect authenticated users away from login
  if (to.path === '/login') {
    if (user.value) {
      return navigateTo('/')
    }
    return
  }

  // Redirect unauthenticated users to login
  if (!user.value) {
    return navigateTo('/login')
  }
  */
})
