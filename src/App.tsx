import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import NewPlan from './pages/NewPlan';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import RequireAuth from './components/RequireAuth';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import AppLayout from './components/AppLayout';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignUp />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="plans" element={<Plans />} />
            <Route path="plans/new" element={<NewPlan />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
