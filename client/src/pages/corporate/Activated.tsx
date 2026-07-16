import { useSearch } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CheckCircle2, Phone, Mail } from "lucide-react";

export default function CorporateActivated() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const accountCode = params.get("account") || "";

  return (
    <>
      <SEO title="Account Activated | LBS Corporate Notary" canonical="/corporate/activated" noIndex />
      <Header />
      <section className="min-h-[65vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#0d1b35]">Account Activated!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Your corporate notary account is now live. Your team can begin scheduling appointments immediately.
          </p>
          {accountCode && (
            <div className="bg-[#f8f9fb] rounded-xl p-5 text-left space-y-1">
              <p className="text-sm text-muted-foreground">Account Code</p>
              <p className="text-2xl font-mono font-bold text-[#0d1b35]">{accountCode}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={accountCode ? `/corporate/book?account=${accountCode}` : "/corporate/book"}>
              <Button className="bg-[#0d1b35] hover:bg-[#1a2d52] text-white px-8">
                Book First Appointment
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-5 justify-center text-sm text-muted-foreground pt-2">
            <a href="tel:2818365357" className="flex items-center justify-center gap-1.5 hover:text-foreground transition-colors">
              <Phone className="w-4 h-4" /> (281) 836-5357
            </a>
            <a href="mailto:info@lbsconnect.net" className="flex items-center justify-center gap-1.5 hover:text-foreground transition-colors">
              <Mail className="w-4 h-4" /> info@lbsconnect.net
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
