import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import AppRoutes from "./routes/AppRoutes";

/**
 * HashRouter is used so the app works on any static host (and when opening
 * the built dist/index.html directly) without server-side rewrite rules.
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
