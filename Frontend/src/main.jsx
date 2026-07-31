import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { ToastProvider } from "./lib/toast.jsx";
import { AuthProvider } from "./lib/auth/AuthContext.jsx";
import { AppDataProvider } from "./lib/AppDataContext.jsx";
import { I18nProvider } from "./lib/i18n.jsx";
import { ThemeProvider } from "./lib/theme.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <AuthProvider>
                <AppDataProvider>
                  <App />
                </AppDataProvider>
              </AuthProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
