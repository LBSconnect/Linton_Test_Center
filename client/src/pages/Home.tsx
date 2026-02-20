import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Phone,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/lib/services";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative min-h-[520px] md:min-h-[600px] flex items-center" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src="/images/hero-testing-center.png"
            alt="LBS4 Testing Center"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f3d]/95 via-[#1a2d52]/85 to-[#1a2d52]/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
              <Shield className="w-4 h-4 text-[#f07050]" />
              Authorized Testing Center in Houston, TX
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              data-testid="text-hero-title"
            >
              Your Path to{" "}
              <span className="bg-gradient-to-r from-[#f07050] to-[#e85d40] bg-clip-text text-transparent">
                Professional
              </span>{" "}
              Certification
            </h1>
            <p
              className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg"
              data-testid="text-hero-subtitle"
            >
              Professional testing services, exam proctoring, and business
              solutions all under one roof. Take the next step in your career.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/services">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white text-base px-8"
                  data-testid="button-hero-services"
                >
                  View Our Services
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-white/5 backdrop-blur-sm"
                  data-testid="button-hero-contact"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background" data-testid="section-trust-bar">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: Shield,
                label: "Authorized Center",
                sub: "Pearson VUE & Certiport",
              },
              {
                icon: Users,
                label: "1000+ Exams",
                sub: "Successfully administered",
              },
              {
                icon: Clock,
                label: "Flexible Hours",
                sub: "Mon-Sat availability",
              },
              {
                icon: CheckCircle2,
                label: "Professional",
                sub: "Certified staff",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center space-y-2"
                data-testid={`stat-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                </div>
                <h3 className="font-semibold text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-services-preview">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2
              className="text-3xl md:text-4xl font-bold"
              data-testid="text-services-heading"
            >
              Our Services
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need for testing, certifications, and professional
              business services.
            </p>
          </div>
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
          <div className="text-center mt-10">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-[#1e3a6e] text-white"
                data-testid="button-view-all-services"
              >
                View All Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-why-choose">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-why-heading">
                Why Choose LBS4?
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                At LBS4, we provide a professional, stress-free testing
                environment. Our commitment to excellence ensures you have
                everything you need to succeed.
              </p>
              <div className="space-y-4">
                {[
                  "Authorized Pearson VUE, Certiport & PMI testing center",
                  "Quiet, professional testing environment",
                  "State-of-the-art equipment and technology",
                  "Conveniently located in Houston, TX",
                  "Friendly and knowledgeable staff",
                  "Multiple services under one roof",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-4"
                  data-testid="button-learn-about"
                >
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card className="border-border/50">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={logoImg}
                      alt="LBS4"
                      className="w-16 h-16 object-contain rounded-md"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-[#1e3a6e] dark:text-white">
                        Visit Us Today
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Walk-ins welcome for most services
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Address</p>
                        <p className="text-sm text-muted-foreground">
                          616 FM 1960 Rd W, Suite 575
                          <br />
                          Houston, TX 77090
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Phone</p>
                        <a
                          href="tel:2818365357"
                          className="text-sm text-muted-foreground"
                        >
                          (281) 836-5357
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Hours</p>
                        <p className="text-sm text-muted-foreground">
                          Mon - Fri: 9:00 AM - 6:00 PM
                          <br />
                          Sat: 10:00 AM - 4:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button
                      className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white mt-4"
                      data-testid="button-contact-cta"
                    >
                      Get Directions & Contact
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e]" data-testid="section-cta">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Whether you need to take a certification exam, get documents
            notarized, or use a professional workstation, we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white text-base px-8"
                data-testid="button-cta-services"
              >
                Book a Service
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="tel:2818365357">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/5"
                data-testid="button-cta-call"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call (281) 836-5357
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
