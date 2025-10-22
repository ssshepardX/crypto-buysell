import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
import { SessionContextProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// HashRouter kullanıldığı için basename artık gerekli değil.
// Ancak, BrowserRouter'dan HashRouter'a geçiş yapıyoruz.

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* HashRouter, GitHub Pages'teki 404 sorununu kesin olarak çözer */}
      <HashRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;