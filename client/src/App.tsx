import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Analytics from "@/components/Analytics";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import Book from "@/pages/Book";
import CorporateLanding from "@/pages/corporate/Landing";
import CorporatePrograms from "@/pages/corporate/Programs";
import CorporateEnroll from "@/pages/corporate/Enroll";
import CorporateActivated from "@/pages/corporate/Activated";
import CorporateBook from "@/pages/corporate/Book";
import CorporateAdmin from "@/pages/admin/CorporateAdmin";
import CorporatePortal from "@/pages/corporate/Portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Analytics />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug" component={ServiceDetail} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-use" component={TermsOfUse} />
        <Route path="/book" component={Book} />
        <Route path="/corporate" component={CorporateLanding} />
        <Route path="/corporate/programs" component={CorporatePrograms} />
        <Route path="/corporate/enroll" component={CorporateEnroll} />
        <Route path="/corporate/activated" component={CorporateActivated} />
        <Route path="/corporate/book" component={CorporateBook} />
        <Route path="/admin/corporate" component={CorporateAdmin} />
        <Route path="/corporate/portal" component={CorporatePortal} />
        <Route component={NotFound} />
      </Switch>
    </>
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
