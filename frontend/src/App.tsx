// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store';
import AuthPage from './pages/AuthPage';
import AppLayout from './pages/AppLayout';

function App() {
  const { token, theme, setTheme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white text-sm font-medium',
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/login" element={!token ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/*" element={token ? <AppLayout /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
