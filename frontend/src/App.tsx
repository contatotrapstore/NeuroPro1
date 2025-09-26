import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InstitutionProvider } from './contexts/InstitutionContext';
import ModernLayout from './components/layout/ModernLayout';
import InstitutionConditionalLayout from './components/layout/InstitutionConditionalLayout';
import InstitutionProtectedRoute from './components/layout/InstitutionProtectedRoute';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicRoute from './components/layout/PublicRoute';
import AdminProtectedRoute from './components/layout/AdminProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Login, Register, ForgotPassword } from './pages/Auth';
import ResetPassword from './pages/Auth/ResetPassword';
import ChatPage from './pages/ChatPage';
import Dashboard from './pages/Dashboard';
import Store from './pages/Store';
import Subscriptions from './pages/Subscriptions';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import PaymentPix from './pages/PaymentPix';
import PixInstructions from './pages/PixInstructions';
import { PaymentConfirmation } from './pages/PaymentConfirmation';
import {
  InstitutionHome,
  InstitutionLogin,
  InstitutionChat,
  InstitutionAdmin,
  InstitutionSubscription,
  InstitutionStore,
  InstitutionSubscriptions,
  InstitutionProfile,
  InstitutionForgotPassword,
  InstitutionRegister
} from './pages/Institution';

// Lazy loading para InstitutionDashboard
const InstitutionDashboard = React.lazy(() =>
  import('./pages/Institution/InstitutionDashboard').then(module => ({ default: module.InstitutionDashboard }))
);
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InstitutionProvider>
          <Router>
          <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/auth/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ForgotPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/reset-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ResetPassword />
              </ProtectedRoute>
            }
          />

          {/* Public Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <PublicRoute>
                <ModernLayout>
                  <Dashboard />
                </ModernLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/store"
            element={
              <PublicRoute>
                <ModernLayout>
                  <Store />
                </ModernLayout>
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <ModernLayout>
                  <Subscriptions />
                </ModernLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:assistantId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ModernLayout>
                  <Profile />
                </ModernLayout>
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminLogin />
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/pix"
            element={
              <ProtectedRoute>
                <PaymentPix />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/pix-instructions"
            element={
              <ProtectedRoute>
                <PixInstructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/confirmation"
            element={
              <ProtectedRoute>
                <PaymentConfirmation />
              </ProtectedRoute>
            }
          />

          {/* Institution Routes */}
          <Route path="/i/:slug/login" element={<InstitutionLogin />} />
          <Route path="/i/:slug/register" element={<InstitutionRegister />} />
          <Route path="/i/:slug/forgot-password" element={<InstitutionForgotPassword />} />

          {/* Institution Chat Routes (Fullscreen, outside layout) */}
          <Route path="/i/:slug/chat" element={
            <InstitutionProtectedRoute>
              <InstitutionChat />
            </InstitutionProtectedRoute>
          } />
          <Route path="/i/:slug/chat/:assistantId" element={
            <InstitutionProtectedRoute>
              <InstitutionChat />
            </InstitutionProtectedRoute>
          } />

          <Route path="/i/:slug" element={<InstitutionConditionalLayout />}>
            <Route index element={
              <Suspense fallback={<div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>Carregando dashboard...</div>}>
                <InstitutionDashboard />
              </Suspense>
            } />
            <Route path="dashboard" element={
              <Suspense fallback={<div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>Carregando dashboard...</div>}>
                <InstitutionDashboard />
              </Suspense>
            } />
            <Route path="store" element={<InstitutionStore />} />
            <Route path="subscriptions" element={
              <InstitutionProtectedRoute>
                <InstitutionSubscriptions />
              </InstitutionProtectedRoute>
            } />
            <Route path="profile" element={
              <InstitutionProtectedRoute>
                <InstitutionProfile />
              </InstitutionProtectedRoute>
            } />
            <Route path="admin" element={
              <InstitutionProtectedRoute>
                <InstitutionAdmin />
              </InstitutionProtectedRoute>
            } />
            <Route path="subscription" element={
              <InstitutionProtectedRoute>
                <InstitutionSubscription />
              </InstitutionProtectedRoute>
            } />
            <Route path="home" element={<InstitutionHome />} />
          </Route>

          {/* Default Redirects */}
          <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
          <Route path="/" element={<Navigate to="/store" replace />} />
          
          {/* 404 Catch All */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-neuro-background flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                  <div className="glass-card p-10 text-center border border-neuro-border-light rounded-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white shadow-glow-lg" style={{
                      background: `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`
                    }}>
                      <span className="text-3xl font-bold">404</span>
                    </div>
                    <h1 className="text-2xl font-bold text-neuro-gray-900 mb-4 font-display">
                      Página não encontrada
                    </h1>
                    <p className="text-neuro-gray-700 mb-8 leading-relaxed font-medium">
                      A página que você está procurando não existe ou foi movida.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => window.history.back()}
                        className="w-full px-6 py-3 glass-card hover:glass-card-hover rounded-xl border border-neuro-border text-neuro-gray-700 hover:text-neuro-gray-900 transition-all font-medium"
                      >
                        ← Voltar
                      </button>
                      <a
                        href="/dashboard"
                        className="block w-full px-6 py-3 rounded-xl text-white font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, #2D5A1F 0%, #4A9A3F 100%)`,
                          boxShadow: `0 4px 15px #2D5A1F30`
                        }}
                      >
                        🏠 Ir para Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            } 
          />
          </Routes>
          </Router>
        </InstitutionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;