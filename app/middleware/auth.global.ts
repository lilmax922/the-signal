export default defineNuxtRouteMiddleware((to) => {
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
})
