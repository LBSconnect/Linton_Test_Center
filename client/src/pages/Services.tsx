import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/lib/services";
import { Shield } from "lucide-react";

export default function Services() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-20 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]" data-testid="section-services-hero">
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
            Our Services
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            From certification exams to notary services, we provide everything
            you need in one convenient location.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background" data-testid="section-services-list">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                image={service.image}
                price={service.price}
                priceLabel={service.priceLabel}
                slug={service.slug}
                icon={<service.icon className="w-5 h-5" />}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30" data-testid="section-exam-programs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
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
