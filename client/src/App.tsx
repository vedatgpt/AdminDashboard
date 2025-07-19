import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Users from "@/pages/admin/Users";
import Ads from "@/pages/admin/Ads";
import Categories from "@/pages/admin/Categories";
import Locations from "@/pages/admin/Locations";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import PersonnelDashboard from "@/pages/PersonnelDashboard";
import UserProfile from "@/pages/Profile";
import Account from "@/pages/account/Account";
import Profile from "@/pages/account/Profile";
import Contact from "./pages/account/Contact";
import AuthorizedPersonnel from "./pages/account/AuthorizedPersonnel";
import PasswordChange from "@/pages/account/PasswordChange";
import ChangeEmail from "@/pages/account/ChangeEmail";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Loading state should be very brief
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/account" component={Account} />
      <Route path="/account/profile" component={Profile} />
      <Route path="/account/contact" component={Contact} />
      <Route path="/account/authorized-personnel" component={AuthorizedPersonnel} />
      <Route path="/account/change-password" component={PasswordChange} />
      <Route path="/account/change-email" component={ChangeEmail} />
      
      {isAuthenticated && user?.role === "authorized_personnel" ? (
        <Route path="/" component={PersonnelDashboard} />
      ) : isAuthenticated && user?.role === "admin" ? (
        <Layout>
          <Switch>
            <Route path="/" component={Users} />
            <Route path="/admin/users" component={Users} />
            <Route path="/admin/listings" component={Ads} />
            <Route path="/admin/categories" component={Categories} />
            <Route path="/admin/locations" component={Locations} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      ) : (
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/:username" component={UserProfile} />
          <Route component={Landing} />
        </Switch>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
