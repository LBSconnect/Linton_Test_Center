import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { XCircle, ArrowRight, Phone } from "lucide-react";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="flex-1 flex items-center justify-center py-20 px-6">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-cancel-title">
              Checkout Cancelled
            </h1>
            <p className="text-muted-foreground">
              Your payment was not completed. No charges have been made. You can
              try again or contact us if you need assistance.
            </p>
            <div className="space-y-3 pt-2">
              <Link href="/services">
                <Button
                  className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                  data-testid="button-try-again"
                >
                  Try Again
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="tel:2818365357">
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  data-testid="button-call-help"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call for Help
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
