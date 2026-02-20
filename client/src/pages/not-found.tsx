import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-7xl font-bold text-[#1e3a6e] dark:text-[#6b9aed]" data-testid="text-404">
            404
          </div>
          <h1 className="text-2xl font-bold" data-testid="text-not-found-title">
            Page Not Found
          </h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button className="bg-[#1e3a6e] text-white mt-4" data-testid="button-go-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
