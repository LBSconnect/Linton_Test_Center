import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/lib/services";
import { Shield, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getNextSaturday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntilSat = day === 6 ? 7 : 6 - day;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntilSat);
  return next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getUrlFilter(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("filter");
}

export default function Services() {
  const nextSat = getNextSaturday();
  const filter = getUrlFilter();

  const visibleServices = filter === "bootcamp"
    ? services.filter((s) => s.saturdayOnly)
    : filter === "business"
    ? services.filter((s) => s.id === "notary" || s.id === "passport")
    : services;

  const showExamCram = !filter;

  const pageTitle =
    filter === "bootcamp" ? "Exam Prep Bootcamps" :
    filter === "business" ? "Business Services" :
    "Our Services";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Testing & Business Services in Houston TX"
        canonical="/services"
        description="Exam testing, insurance license boot camps, notary services & passport photos in Houston, TX. Authorized Pearson VUE & Certiport center at 616 FM 1960 Rd W. Book online or call (281) 836-5357."
      />
      <Header />

      <section className="relative py-12 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]" data-testid="section-services-hero">
        <div className="absolute inset-0 bg-[url('/images/hero-testing-center.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <Shield className="w-4 h-4 text-[#f07050]" />
            Professional Services
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold text-white"
            data-testid="text-services-title"
          >
            {pageTitle}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            From certification exams to notary services, we provide everything
            you need in one convenient location.
          </p>
        </div>
      </section>

      <section className="py-12 bg-background" data-testid="section-services-list">
        <div className="max-w-7xl mx-auto px-6">
          {filter && (
            <div className="mb-6">
              <a href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to all services
              </a>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showExamCram && (
              /* Exam Cram — external link to MyEasyPass, shown on unfiltered view only */
              <Card
                className="group border-border/50 bg-card transition-all duration-300 hover-elevate"
                data-testid="card-service-exam-cram"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-md bg-white border-2 border-[#1e3a6e]">
                  <img
                    src="/images/myeasypass-logo.png"
                    alt="MyEasyPass - Exam Cram"
                    className="w-full h-full object-contain p-6"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-md px-3 py-1.5 shadow-sm">
                    <span className="text-lg font-bold text-[#1e3a6e] dark:text-white">$19.99</span>
                    <span className="text-xs text-muted-foreground ml-1">/month</span>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center text-[#1e3a6e] dark:text-[#6b9aed]">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <h3 className="font-semibold text-lg leading-tight" data-testid="text-service-title-exam-cram">
                        Exam Cram
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2" data-testid="text-service-desc-exam-cram">
                        Practice tests for Texas Real Estate, Insurance, and Professional licensing exams.
                      </p>
                    </div>
                  </div>
                  <a href="https://www.myeasypass.net" target="_blank" rel="noopener noreferrer">
                    <Button
                      size="sm"
                      className="w-full mt-2 group/btn bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white border-0"
                      data-testid="button-learn-more-exam-cram"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}
            {visibleServices.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                image={service.image}
                price={service.price}
                priceLabel={service.priceLabel}
                slug={service.slug}
                href={service.link}
                icon={<service.icon className="w-5 h-5" />}
                badge={service.saturdayOnly ? `Next: ${nextSat}` : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30" data-testid="section-exam-programs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl font-bold">Supported Exam Programs</h2>
            <p className="text-muted-foreground">
              We are an authorized testing center for major certification
              programs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Pearson VUE",
                desc: "IT certifications, professional licenses, and academic admissions exams from hundreds of programs worldwide.",
              },
              {
                name: "Certiport",
                desc: "Microsoft Office Specialist (MOS), Adobe Certified Professional, and other industry certifications.",
              },
              {
                name: "PMI",
                desc: "Project Management Professional (PMP), CAPM, and other PMI certification exams.",
              },
            ].map((program) => (
              <div
                key={program.name}
                className="bg-card border border-border/50 rounded-md p-6 space-y-3 text-center"
                data-testid={`card-program-${program.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="w-14 h-14 rounded-full bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7 text-[#1e3a6e] dark:text-[#6b9aed]" />
                </div>
                <h3 className="font-semibold text-lg">{program.name}</h3>
                <p className="text-sm text-muted-foreground">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
