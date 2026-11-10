import { BrowserRouter } from 'react-router-dom'
import AuthProvider from '../features/auth/AuthProvider.jsx'
import { authApi } from '../features/auth/api/authApi.js'
import { ToastProvider } from '../shared/ui/ToastProvider.jsx'

export default function AppProviders({ children, initialUser, authAdapter }) {
  const sessionAdapter = authAdapter ?? (initialUser ? null : authApi)
  return <BrowserRouter><AuthProvider initialUser={initialUser} authAdapter={sessionAdapter}><ToastProvider>{children}</ToastProvider></AuthProvider></BrowserRouter>
}
