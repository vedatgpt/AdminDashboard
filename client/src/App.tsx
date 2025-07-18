import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Users from "@/pages/Users";
import Ads from "@/pages/Ads";
import Categories from "@/pages/Categories";
import Locations from "@/pages/Locations";
import NotFound from "@/pages/not-found";

function Router() {
  return (
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
