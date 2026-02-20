import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Shield,
  Award,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-20 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]" data-testid="section-about-hero">
        <div className="absolute inset-0 bg-[url('/images/hero-testing-center.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="text-about-title">
            About LBS
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            A division of Linton Business Solutions LLC, providing professional
            testing and business services in Houston, Texas.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-about-story">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed">
                LBS is the Test and Exam Center division of Linton Business
                Solutions LLC (LVBS). We were established to provide the Houston
                community with a professional, reliable, and accessible testing
                center that meets the highest industry standards.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to empower individuals and professionals by
                providing a world-class testing environment and essential
                business services. We understand that taking a certification
                exam or completing important business tasks requires focus,
                comfort, and professional support — and that's exactly what we
                deliver.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Located conveniently in Houston, Texas, our facility is equipped
                with modern technology and staffed by dedicated professionals
                who are committed to making your experience seamless and
                stress-free.
              </p>
            </div>
            <div className="flex justify-center">
              <Card className="max-w-sm w-full border-border/50">
                <CardContent className="p-8 text-center space-y-6">
                  <img
                    src={logoImg}
                    alt="Linton Business Solutions Logo"
                    className="w-32 h-32 object-contain mx-auto"
                    data-testid="img-about-logo"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-[#1e3a6e] dark:text-white">
                      Linton Business Solutions
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      LLC (LVBS)
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Professional testing, proctoring, and business services for
                    the greater Houston area.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-about-values">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-bold">Our Values</h2>
            <p className="text-muted-foreground">
              Everything we do is guided by our commitment to excellence and
              service.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Integrity",
                desc: "We operate with the highest ethical standards and maintain strict testing protocols.",
              },
              {
                icon: Award,
                title: "Excellence",
                desc: "We strive for perfection in every service we provide to our clients.",
              },
              {
                icon: Users,
                title: "Community",
                desc: "We're committed to serving and empowering our Houston community.",
              },
              {
                icon: Target,
                title: "Innovation",
                desc: "We continuously upgrade our technology and services to stay ahead.",
              },
            ].map((value) => (
              <Card key={value.title} className="border-border/50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center mx-auto">
                    <value.icon className="w-7 h-7 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <h3 className="font-semibold text-lg">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background" data-testid="section-about-authorizations">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-bold">Authorizations & Partnerships</h2>
            <p className="text-muted-foreground">
              We are proud to be authorized by leading testing organizations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Pearson VUE",
                desc: "Authorized testing center for hundreds of certification programs worldwide. We deliver exams for IT, healthcare, finance, and many more industries.",
              },
              {
                name: "Certiport",
                desc: "Official testing center for Microsoft Office Specialist, Adobe Certified Professional, and other industry-leading certifications.",
              },
              {
                name: "PMI",
                desc: "Authorized center for Project Management Institute exams including PMP, CAPM, and other project management certifications.",
              },
            ].map((partner) => (
              <div
                key={partner.name}
                className="bg-card border border-border/50 rounded-md p-6 space-y-3"
                data-testid={`card-partner-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <CheckCircle2 className="w-8 h-8 text-[#e85d40]" />
                <h3 className="font-semibold text-lg">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to Experience the Difference?
          </h2>
          <p className="text-lg text-white/80">
            Visit our testing center today and see why professionals choose LBS.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                data-testid="button-about-cta-services"
              >
                Explore Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/5"
                data-testid="button-about-cta-contact"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
