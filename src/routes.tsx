
import { Navigate, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>    
      {/* Route principale */}
      <Route path="/" element={<Index />} />
      
      {/* Fallback pour les routes inconnues */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
