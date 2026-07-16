import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Phone, Star } from "lucide-react";

export default function CheckoutSuccess() {

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="Payment Successful" canonical="/checkout/success" noIndex />
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
              <a
                href="https://g.page/r/lbs-test-exam-center/review"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Leave Us a Google Review
                </Button>
              </a>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-back-home"
                >
                  Return to Home
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="tel:2818365357">
                <Button
                  variant="outline"
                  className="w-full"
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
