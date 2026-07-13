import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { services } from "@/lib/services";
import { CalendarCheck, ArrowRight, ExternalLink, Phone } from "lucide-react";

export default function Book() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-16 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]">
        <div className="absolute inset-0 bg-[url('/images/hero-testing-center.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <CalendarCheck className="w-4 h-4 text-[#f07050]" />
            Schedule an Appointment
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Book an Appointment
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Select a service below to choose your date and time and complete your booking online.
          </p>
        </div>
      </section>

      <section className="py-14 bg-background flex-1">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`}>
              <div className="group flex items-center justify-between gap-4 p-5 rounded-lg border border-border/50 bg-card hover:border-[#1e3a6e]/40 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center text-[#1e3a6e] dark:text-[#6b9aed]">
                    <service.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{service.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {service.price && (
                    <span className="text-sm font-semibold text-[#1e3a6e] dark:text-[#6b9aed] whitespace-nowrap">
                      {service.price}{service.priceLabel}
                    </span>
                  )}
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#1e3a6e] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          ))}

          <a href="https://www.myeasypass.net" target="_blank" rel="noopener noreferrer">
            <div className="group flex items-center justify-between gap-4 p-5 rounded-lg border border-border/50 bg-card hover:border-[#1e3a6e]/40 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center">
                  <img src="/images/myeasypass-logo.png" alt="MyEasyPass" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">Exam Cram (MyEasyPass)</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Online practice tests for Texas licensing exams — register at myeasypass.net</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-[#1e3a6e] dark:text-[#6b9aed] whitespace-nowrap">$19.99/mo</span>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-[#1e3a6e] transition-colors" />
              </div>
            </div>
          </a>
        </div>
      </section>

      <section className="py-10 bg-muted/30 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-3">
          <p className="text-muted-foreground">Prefer to book by phone? Give us a call.</p>
          <a href="tel:2818365357">
            <Button variant="outline" className="gap-2">
              <Phone className="w-4 h-4" />
              (281) 836-5357
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
