import { BrowserRouter } from 'react-router-dom'
import AuthProvider from '../features/auth/AuthProvider.jsx'
import { ToastProvider } from '../shared/ui/ToastProvider.jsx'

export default function AppProviders({ children, initialUser, authAdapter }) {
  return <BrowserRouter><AuthProvider initialUser={initialUser} authAdapter={authAdapter}><ToastProvider>{children}</ToastProvider></AuthProvider></BrowserRouter>
}
