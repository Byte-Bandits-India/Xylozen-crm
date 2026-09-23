import './App.css'
import { SidebarProvider } from './components/ui/sidebar'
import { AppSidebar } from './components/Sidebar/AppSidebar'
import AuthModal from './components/login/AuthModal'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './store'
import { queryClient } from './lib/queryClient'
import { useAuth, AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { TopNavbar } from './components/Navbar/TopNavbar'
import { APP_PAGES, APP_REDIRECTS } from '@/config/pages.config'

function MainArea() {
  return (
    <Routes>
      {/* Centralized dynamic route generation from APP_PAGES */}
      {APP_PAGES.flatMap((page) => {
        const routes = [
          <Route
            key={page.path}
            path={page.path}
            element={
              <ProtectedRoute pageKey={page.key} allowedRoles={page.allowedRoles}>
                <page.component />
              </ProtectedRoute>
            }
          />,
        ]

        if (page.aliases) {
          for (const alias of page.aliases) {
            const ComponentToRender = alias.component || page.component
            routes.push(
              <Route
                key={alias.path}
                path={alias.path}
                element={
                  <ProtectedRoute
                    pageKey={page.key}
                    allowedRoles={alias.allowedRoles || page.allowedRoles}
                  >
                    <ComponentToRender />
                  </ProtectedRoute>
                }
              />
            )
          }
        }

        return routes
      })}

      {/* Centralized redirects */}
      {APP_REDIRECTS.map((redirect) => (
        <Route
          key={redirect.from}
          path={redirect.from}
          element={<Navigate to={redirect.to} replace />}
        />
      ))}

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppContent() {
  const { showModal, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-muted-foreground font-medium tracking-wide bg-muted animate-pulse">
        Loading Dashboard...
      </div>
    )
  }

  return (
    <>
      {showModal && <AuthModal />}

      {user ? (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-muted">
            <AppSidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <TopNavbar />
              <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
                <MainArea />
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <div className="flex min-h-screen w-full justify-center items-center" />
      )}
    </>
  )
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
