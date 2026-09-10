import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlatformProvider } from "./contexts/PlatformContext";
import { AdminGate } from "./components/AdminGate";
import { InstallPrompt } from "./components/InstallPrompt";
import { LaunchScreen } from "./components/LaunchScreen";
import { VoiceAssistant } from "./components/VoiceAssistant";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import CreatorProfile from "./pages/CreatorProfile";
import Discover from "./pages/Discover";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LaunchScreen />
      <BrowserRouter>
        <PlatformProvider>
          <InstallPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/creator/:creatorId" element={<CreatorProfile />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/admin" element={<AdminGate><Admin /></AdminGate>} />
            <Route path="/admin/analytics" element={<AdminGate allow={["owner", "admin", "analyst"]}><Analytics /></AdminGate>} />
            <Route path="/admin/team" element={<AdminGate allow={["owner", "admin", "editor", "analyst"]}><Team /></AdminGate>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <VoiceAssistant />
        </PlatformProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
