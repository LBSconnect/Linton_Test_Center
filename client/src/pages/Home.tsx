import { useState } from "react";
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
  Award,
  BookOpen,
  FileCheck,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

function getNextSaturday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntilSat = day === 6 ? 7 : 6 - day;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntilSat);
  return next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const faqs = [
  {
    q: "Do I need to register with Pearson VUE or Certiport before booking here?",
    a: "Yes — create your account and purchase your exam voucher directly at pearsonvue.com or certiport.com first. Then book your seat here at LBS. We serve as your authorized local testing location.",
  },
  {
    q: "What ID do I need to bring?",
    a: "A valid government-issued photo ID — driver's license, passport, or state ID. Your name must match your exam registration exactly. This is a strict Pearson VUE and Certiport requirement.",
  },
  {
    q: "Can I walk in for notary or passport photos?",
    a: "Yes. Walk-ins are always welcome for notary services and passport photos during regular business hours (Mon–Fri 8 AM–5 PM, Sat 8 AM–4 PM). No appointment needed.",
  },
  {
    q: "How far in advance do I need to schedule a testing appointment?",
    a: "We recommend booking at least 48–72 hours in advance to secure your preferred time slot. Saturday bootcamp seats fill quickly — book at least a week ahead when possible.",
  },
  {
    q: "Where do I park?",
    a: "Free parking is available directly in front of our suite at 616 FM 1960 Rd W, Ste 101, Houston TX 77090. We're in a strip center with plenty of spots.",
  },
  {
    q: "What happens if I need to reschedule?",
    a: "Contact us at least 24 hours before your appointment to reschedule at no charge. For Pearson VUE exams, their reschedule policy applies — check your confirmation email from them for details.",
  },
];

const testimonials = [
  {
    initials: "KS",
    name: "Kelly Somes",
    service: "Google Review",
    quote:
      "I have no words to describe how great Linton Business Solutions was. The facility is clean, comfortable and very well managed. I was welcomed with a smile when I first walked in. Mr. Linton was so kind and welcoming — he definitely put me at ease. I had to take an exam and was very nervous. I've taken other tests at other testing centers and this was by far the best experience. Thank you Mr. Linton.",
  },
  {
    initials: "CF",
    name: "Cayla Fisch",
    service: "Google Review",
    quote:
      "They are absolutely amazing!!! So helpful in every way and literally my own personal cheerleaders!! They didn't let me give up and made sure I was gonna pass!! God send people and so thankful for them!!",
  },
  {
    initials: "KL",
    name: "Kel Living",
    service: "Google Review",
    quote:
      "I had a wonderful experience. Everyone was so nice. The process from setup all the way to pressing submit was great. They provide reassurance and speak positivity into you to help calm you before entering the testing area. And let's not forget the celebration they provide after you pass! Definitely will always be my site of choice!!! Thank you all for everything.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const nextSat = getNextSaturday();

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <SEO
        canonical="/"
        description="Authorized Pearson VUE & Certiport testing center in Houston, TX. Texas Real Estate exam, Insurance license exam prep, boot camps, private exam proctoring, notary services & passport photos at 616 FM 1960 Rd W, Ste 101. Call (281) 836-5357."
      />
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-[520px] md:min-h-[600px] flex items-center" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src="/images/hero-testing-center.png"
            alt="LBS Testing Center"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f3d]/95 via-[#1a2d52]/85 to-[#1a2d52]/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
              <Shield className="w-4 h-4 text-[#f07050]" />
              Authorized Pearson VUE · Certiport · PMI Testing Center
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#fbbf24] text-xl tracking-wide leading-none">★★★★★</span>
              <span className="text-white/75 text-sm">5.0 on Google Reviews</span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              data-testid="text-hero-title"
            >
              Pass Your Exam.{" "}
              <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8c86c] bg-clip-text text-transparent">
                Get Certified.
              </span>
              <br className="hidden sm:block" /> Start Today.
            </h1>
            <p
              className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg"
              data-testid="text-hero-subtitle"
            >
              Houston's authorized testing center for Pearson VUE, Certiport, and professional licensing exams.
              Walk-in notary and passport photos always available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/book">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white text-base px-8"
                  data-testid="button-hero-book"
                >
                  Book an Appointment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="tel:2818365357">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-white/5 backdrop-blur-sm"
                  data-testid="button-hero-call"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  (281) 836-5357
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF BAR ── */}
      <section className="py-8 bg-background border-b border-border/50" data-testid="section-trust-bar">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 md:gap-6">
            {[
              { icon: Shield, label: "Pearson VUE", sub: "Authorized Center", amber: false },
              { icon: Award, label: "Certiport", sub: "Authorized Center", amber: false },
              { icon: Users, label: "PMI Exams", sub: "Authorized Center", amber: false },
              { icon: CheckCircle2, label: "1,200+ Exams", sub: "Administered", amber: false },
              { icon: null, label: "5.0 Stars", sub: "Google Reviews", amber: true },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center space-y-2"
                data-testid={`stat-${item.label.toLowerCase().replace(/[\s+]/g, "-")}`}
              >
                <div
                  className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                    item.amber
                      ? "bg-[#fef3c7] dark:bg-[#92400e]/30"
                      : "bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20"
                  }`}
                >
                  {item.amber ? (
                    <span className="text-[#d97706] text-xl leading-none">★</span>
                  ) : (
                    item.icon && <item.icon className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  )}
                </div>
                <h3 className="font-semibold text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT BRINGS YOU IN? (3-path selector) ── */}
      <section className="py-14 bg-muted/30" data-testid="section-paths">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Find Your Path</p>
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-paths-heading">
              What brings you in today?
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose your service and go straight to booking.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Path 1: Certiport */}
            <Link href="/services/certification-exam-testing">
              <div className="group relative bg-card border border-border/50 rounded-xl p-7 cursor-pointer transition-all duration-200 hover:border-[#1e3a6e]/60 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center mb-5">
                  <Award className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Certiport Exam Testing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  Book a seat at our authorized Certiport testing center for Microsoft Office Specialist, Adobe, IC3, and other Certiport certification exams. $35/session.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Certiport Authorized", "Microsoft (MOS)", "Adobe", "IC3"].map((tag) => (
                    <span key={tag} className="text-xs bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 text-[#1e3a6e] dark:text-[#6b9aed] px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#e85d40] group-hover:gap-2.5 transition-all">
                  Book your Certiport seat <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Path 2: Bootcamp */}
            <Link href="/services?filter=bootcamp">
              <div className="group relative bg-card border border-border/50 rounded-xl p-7 cursor-pointer transition-all duration-200 hover:border-[#1e3a6e]/60 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#c9a84c]/15 text-[#92650a] dark:text-[#c9a84c] border border-[#c9a84c]/30 rounded-full px-2.5 py-1">
                    Next: {nextSat}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">Exam Prep Bootcamp</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  Intensive Saturday morning bootcamps for Texas insurance and real estate licensing exams.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Life Insurance", "P&C Insurance", "Every Saturday"].map((tag) => (
                    <span key={tag} className="text-xs bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 text-[#1e3a6e] dark:text-[#6b9aed] px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#e85d40] group-hover:gap-2.5 transition-all">
                  View bootcamp options <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Path 3: Business Services */}
            <Link href="/services?filter=business">
              <div className="group relative bg-card border border-border/50 rounded-xl p-7 cursor-pointer transition-all duration-200 hover:border-[#1e3a6e]/60 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-full px-2.5 py-1">
                    Walk-ins Welcome
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">Business Services</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                  Professional <strong className="text-foreground">Notary</strong> services and <strong className="text-foreground">Passport</strong> photos. No appointment needed during business hours.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Notary", "Passport Photos", "Same Day"].map((tag) => (
                    <span key={tag} className="text-xs bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 text-[#1e3a6e] dark:text-[#6b9aed] px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#e85d40] group-hover:gap-2.5 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

          </div>
          <div className="text-center mt-8">
            <Link href="/services">
              <Button variant="outline" size="sm" className="text-sm" data-testid="button-view-all-services">
                View all services
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 bg-background" data-testid="section-how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold">How to Book Your Exam</h2>
            <p className="text-muted-foreground text-lg">Three steps from today to test day.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-7 left-[calc(16.7%+28px)] right-[calc(16.7%+28px)] h-px bg-gradient-to-r from-[#c9a84c]/40 via-[#1e3a6e]/30 to-[#c9a84c]/40" />
            {[
              {
                num: "1",
                title: "Register with the Exam Provider",
                desc: "Create your account and purchase your exam voucher directly at pearsonvue.com or certiport.com.",
                note: "Required before booking with us",
              },
              {
                num: "2",
                title: "Book Your Seat at LBS",
                desc: "Choose your date and time at our center, complete your booking online, and pay the facility fee.",
                note: null,
              },
              {
                num: "3",
                title: "Come In and Test",
                desc: "Arrive with your confirmation and a valid government-issued photo ID. We handle the rest.",
                note: "Arrive 15 min early",
              },
            ].map((step) => (
              <div key={step.num} className="text-center space-y-4 relative z-10">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#1e3a6e] flex items-center justify-center ring-4 ring-background">
                  <span className="text-[#c9a84c] font-extrabold text-xl">{step.num}</span>
                </div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {step.note && (
                  <span className="inline-block text-xs font-semibold text-[#e85d40]">{step.note}</span>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/services/certification-exam-testing">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white px-8"
                data-testid="button-how-book"
              >
                Book Step 2 Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 bg-muted/30" data-testid="section-testimonials">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">What Our Clients Say</p>
            <h2 className="text-3xl md:text-4xl font-bold">Real Results, Real People</h2>
            <p className="text-muted-foreground text-lg">
              Join hundreds of Houston professionals who passed their exams at LBS.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50 bg-card flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1 space-y-4">
                  <div className="text-[#fbbf24] text-sm tracking-widest">★★★★★</div>
                  <p className="text-sm text-foreground leading-relaxed italic flex-1">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                    <div className="w-9 h-9 rounded-full bg-[#1e3a6e] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.service}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-muted-foreground">
            See more reviews on{" "}
            <a
              href="https://g.co/kgs/your-google-business-link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e3a6e] dark:text-[#6b9aed] font-medium hover:underline"
            >
              Google
            </a>
          </p>
        </div>
      </section>

      {/* ── WHY CHOOSE LBS ── */}
      <section className="py-14 bg-background" data-testid="section-why-choose">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-why-heading">
                Why Choose LBS Test & Exam Center?
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                A professional, stress-free testing environment with friendly staff who know what it takes to help you succeed.
              </p>
              <div className="space-y-4">
                {[
                  "Authorized Pearson VUE, Certiport & PMI testing center",
                  "Quiet, distraction-free testing environment",
                  "State-of-the-art equipment and individual workstations",
                  "Conveniently located in Houston with free parking",
                  "Walk-in notary and passport photos — no appointment needed",
                  "Multiple professional services under one roof",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="outline" size="lg" className="mt-4" data-testid="button-learn-about">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card className="border-border/50">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={logoImg} alt="LBS" className="w-16 h-16 object-contain rounded-md" />
                    <div>
                      <h3 className="text-xl font-bold text-[#1e3a6e] dark:text-white">Visit Us Today</h3>
                      <p className="text-sm text-muted-foreground">Walk-ins welcome for most services</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Address</p>
                        <p className="text-sm text-muted-foreground">
                          616 FM 1960 Rd W, Ste 101<br />Houston, TX 77090-3048
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Phone</p>
                        <a href="tel:2818365357" className="text-sm text-muted-foreground hover:text-foreground">
                          (281) 836-5357
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Hours</p>
                        <p className="text-sm text-muted-foreground">
                          Mon – Fri: 8:00 AM – 5:00 PM<br />
                          Sat: 8:00 AM – 4:00 PM<br />
                          Closed Sun
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

      {/* ── FAQ ── */}
      <section className="py-14 bg-muted/30" data-testid="section-faq">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know before you arrive.</p>
          </div>
          <div className="max-w-2xl mx-auto divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden bg-card">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold hover:bg-muted/40 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#c9a84c] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Still have questions?{" "}
              <a href="tel:2818365357" className="text-[#e85d40] font-semibold hover:underline">
                Call us at (281) 836-5357
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-14 bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e]" data-testid="section-cta">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Ready When You Are</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Reserve Your Testing Appointment Today
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Certified testing, exam prep bootcamps, notary, and passport photos — all at one Houston location.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/book">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white text-base px-8"
                data-testid="button-cta-book"
              >
                Schedule an Appointment
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

      {/* ── MOBILE STICKY CTA BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex gap-2.5 p-3 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg" data-testid="mobile-sticky-bar">
        <a href="tel:2818365357" className="flex-1">
          <Button variant="outline" className="w-full gap-2 font-semibold text-sm h-11" size="sm">
            <Phone className="w-4 h-4" />
            Call
          </Button>
        </a>
        <Link href="/book" className="flex-[2]">
          <Button
            className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white font-bold text-sm h-11"
            size="sm"
          >
            Book Now
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
