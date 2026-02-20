import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Phone } from "lucide-react";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="flex-1 flex items-center justify-center py-20 px-6">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-success-title">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              Thank you for your purchase! You will receive a confirmation email
              shortly. If you have any questions, please don't hesitate to
              contact us.
            </p>
            <div className="space-y-3 pt-2">
              <Link href="/">
                <Button
                  className="w-full bg-[#1e3a6e] text-white"
                  data-testid="button-back-home"
                >
                  Return to Home
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="tel:2818365357">
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  data-testid="button-call-support"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call (281) 836-5357
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
