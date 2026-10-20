import AppProviders from './app/AppProviders.jsx'
import AppRouter from './app/AppRouter.jsx'
import './App.css'

export default function App({ initialUser = null, authAdapter = null }) {
  return <AppProviders initialUser={initialUser} authAdapter={authAdapter}><AppRouter /></AppProviders>
}
