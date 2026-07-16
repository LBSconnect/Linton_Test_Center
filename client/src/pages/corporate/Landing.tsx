import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  Building2,
  ShieldCheck,
  CalendarCheck,
  FileText,
  Users,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
} from "lucide-react";

const benefits = [
  {
    icon: CalendarCheck,
    title: "Priority Scheduling",
    description: "Reserved appointment windows and dedicated booking links for your employees, with no waiting in queues.",
  },
  {
    icon: ShieldCheck,
    title: "Compliant & Secure",
    description: "Texas-licensed notary public with secure document handling and scan-to-email capabilities for authorized staff.",
  },
  {
    icon: FileText,
    title: "Monthly Reporting",
    description: "Detailed utilization statements and notarial act tracking included with every corporate plan.",
  },
  {
    icon: Users,
    title: "Multi-User Management",
    description: "Designate company administrators who can schedule appointments on behalf of employees.",
  },
  {
    icon: Star,
    title: "Dedicated Account Manager",
    description: "Gold tier clients receive a named account manager for personalized support and escalation.",
  },
  {
    icon: Clock,
    title: "Predictable Billing",
    description: "Flat monthly subscription with overage billing at statutory rates. No surprises.",
  },
];

const steps = [
  {
    number: "01",
    title: "Submit Enrollment",
    description: "Complete our online enrollment form with your company details and choose a plan tier.",
  },
  {
    number: "02",
    title: "Account Review",
    description: "Our team reviews your enrollment within 1–2 business days and confirms plan eligibility.",
  },
  {
    number: "03",
    title: "Activate & Pay",
    description: "Receive your activation link, complete secure payment, and your account goes live immediately.",
  },
  {
    number: "04",
    title: "Start Booking",
    description: "Employees use your dedicated booking link to schedule notarial appointments instantly.",
  },
];

export default function CorporateLanding() {
  return (
    <>
      <SEO
        title="LBS Enterprise Corporate Notary Services Houston TX"
        description="Dedicated corporate notary services for Houston businesses. Monthly subscription plans: Bronze, Silver, Gold. Priority scheduling, account management, scan-to-email."
        canonical="/corporate"
      />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0d1b35] via-[#1a2d52] to-[#0d1b35] text-white pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 px-4 py-1.5 text-sm font-semibold tracking-wide uppercase">
            LBS Enterprise Division
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Corporate Notary Services<br />
            <span className="text-[#c9a84c]">Built for Houston Businesses</span>
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            Monthly subscription plans that give your team reliable, priority access to a Texas-licensed
            notary. No scheduling hassle and no per-appointment surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/corporate/programs">
              <Button
                size="lg"
                className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold px-8 py-6 text-base"
              >
                View Plans & Pricing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/corporate/enroll">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 px-8 py-6 text-base"
              >
                Start Enrollment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-[#0d1b35] border-b border-[#c9a84c]/20 py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
          {[
            "Texas Licensed Notary",
            "BBB Accredited Business",
            "Secure Document Handling",
            "Serving Greater Houston",
            "Since 2018",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#c9a84c]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0d1b35] mb-3">
              Why Choose a Corporate Notary Plan?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Eliminate the friction of one-off notary visits and give your operations a reliable, compliant workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="p-6 rounded-xl border border-border/60 bg-white hover:shadow-md transition-shadow space-y-3"
              >
                <div className="w-11 h-11 rounded-lg bg-[#0d1b35]/5 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <h3 className="font-semibold text-[#0d1b35]">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0d1b35] mb-3">How It Works</h2>
            <p className="text-muted-foreground">From enrollment to first appointment in as little as 2 business days.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="space-y-3">
                <div className="text-4xl font-extrabold text-[#c9a84c]/30">{step.number}</div>
                <h3 className="font-semibold text-[#0d1b35] text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan teaser */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-[#0d1b35]">Plans Starting at $250/month</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the tier that fits your notarial volume: Bronze, Silver, or Gold.
            All plans include online scheduling, email confirmations, and monthly statements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/corporate/programs">
              <Button
                size="lg"
                className="bg-[#0d1b35] hover:bg-[#1a2d52] text-white px-8 py-6 text-base"
              >
                Compare Plans
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            * Texas law sets notarial fees. Additional acts beyond plan limits are billed at statutory rates.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6 bg-gradient-to-br from-[#0d1b35] to-[#1a2d52]">
        <div className="max-w-3xl mx-auto text-center text-white space-y-6">
          <Building2 className="w-12 h-12 text-[#c9a84c] mx-auto" />
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-white/75">
            Submit your enrollment today. Our team reviews every application personally and
            responds within 1–2 business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/corporate/enroll">
              <Button
                size="lg"
                className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold px-8 py-6 text-base"
              >
                Enroll Your Company
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-white/60 pt-2">
            <a href="tel:2818365357" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-4 h-4" /> (281) 836-5357
            </a>
            <a href="mailto:info@lbsconnect.net" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" /> info@lbsconnect.net
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
