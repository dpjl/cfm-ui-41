
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { Toaster } from './components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GalleryProvider } from './contexts/GalleryContext';
import { useViewportHeight } from './hooks/use-viewport-height';

// Composant App avec le hook useViewportHeight
function AppWithViewportHeight() {
  // Appliquer le hook pour calculer la hauteur du viewport
  useViewportHeight();
  
  return (
    <div className="app-container h-viewport-safe">
      <AppRoutes />
      <Toaster />
    </div>
  );
}

// Création du client de requête
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GalleryProvider>
        <BrowserRouter>
          <AppWithViewportHeight />
        </BrowserRouter>
      </GalleryProvider>
    </QueryClientProvider>
  );
}

export default App;
