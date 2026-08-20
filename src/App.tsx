import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToasterProvider } from './components';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { AppRouter } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, 
      gcTime: 30 * 60 * 1000, 
      retry: 1,
      networkMode: 'always',
      refetchOnWindowFocus: false, 
      refetchOnMount: false, 
      refetchOnReconnect: false,
    },
    mutations: { networkMode: 'always' },
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToasterProvider>
            <BrowserRouter>
              <AuthProvider>
                <AppRouter />
              </AuthProvider>
            </BrowserRouter>
          </ToasterProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
