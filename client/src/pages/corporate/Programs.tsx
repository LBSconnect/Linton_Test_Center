import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { CheckCircle2, ArrowRight, Star, Phone, Mail } from "lucide-react";

const plans = [
  {
    tier: "bronze",
    name: "Bronze",
    price: "$250",
    acts: 20,
    admins: 1,
    badge: null,
    color: "#cd7f32",
    features: [
      "Up to 20 notarial acts per month",
      "Online appointment scheduling",
      "Priority appointment access",
      "Monthly activity statement",
      "1 company administrator",
      "Email confirmations",
      "Secure office environment",
    ],
  },
  {
    tier: "silver",
    name: "Silver",
    price: "$400",
    acts: 50,
    admins: 3,
    badge: "Most Popular",
    color: "#1e3a6e",
    features: [
      "Up to 50 notarial acts per month",
      "Dedicated booking link for employees",
      "Priority scheduling",
      "Secure document handling",
      "Scan-to-email (authorized staff only)",
      "Monthly utilization report",
      "3 company administrators",
      "Email confirmations & reminders",
    ],
  },
  {
    tier: "gold",
    name: "Gold",
    price: "$750",
    acts: 100,
    admins: 5,
    badge: "Premium",
    color: "#c9a84c",
    features: [
      "Up to 100 notarial acts per month",
      "Reserved appointment windows",
      "Dedicated account manager",
      "Monthly utilization reports",
      "Additional usage billed at statutory rates",
      "Priority queue access",
      "Scan-to-email included",
      "Up to 5 company administrators",
      "Corporate account portal (Phase 2)",
    ],
  },
];

const faqs = [
  {
    q: "What counts as a notarial act?",
    a: "Each signature notarized (acknowledgment, jurat, copy certification, etc.) counts as one act. Texas law sets the maximum fee per act.",
  },
  {
    q: "What happens if we exceed our monthly acts?",
    a: "Additional acts are billed at Texas statutory rates ($6 per act for most document types). We notify your administrator before billing overages.",
  },
  {
    q: "Can we change plans?",
    a: "Yes. Upgrades take effect immediately; downgrades apply at the start of the next billing cycle. Contact us to adjust your plan.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. There are no setup or cancellation fees. Your first billing period begins on account activation.",
  },
  {
    q: "What documents can your notary handle?",
    a: "Real estate documents, powers of attorney, affidavits, contracts, and most standard notarial acts. We do not provide legal advice or draft legal documents.",
  },
];

export default function CorporatePrograms() {
  return (
    <>
      <SEO
        title="Corporate Notary Plans — Bronze, Silver, Gold | LBS Houston"
        description="Compare LBS corporate notary subscription plans. Bronze $250/mo (20 acts), Silver $400/mo (50 acts), Gold $750/mo (100 acts). Serving Houston TX businesses."
        canonical="/corporate/programs"
      />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0d1b35] to-[#1a2d52] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 px-4 py-1.5 text-sm font-semibold tracking-wide uppercase">
            Corporate Plans
          </Badge>
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Flat monthly subscription with predictable pricing. All plans include priority access,
            email confirmations, and monthly activity statements.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl bg-white border-2 shadow-sm overflow-hidden transition-shadow hover:shadow-lg ${
                plan.badge === "Most Popular" ? "border-[#1e3a6e]" : "border-border/50"
              }`}
            >
              {plan.badge && (
                <div
                  className="text-center py-2 text-xs font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: plan.color }}
                >
                  {plan.badge}
                </div>
              )}
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" style={{ color: plan.color }} />
                    <span className="font-bold text-lg text-[#0d1b35]">{plan.name}</span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[#0d1b35]">{plan.price}</span>
                    <span className="text-muted-foreground pb-1">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Up to <strong>{plan.acts} notarial acts</strong> · {plan.admins} admin{plan.admins > 1 ? "s" : ""}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.color }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={`/corporate/enroll?plan=${plan.tier}`}>
                  <Button
                    className="w-full text-white font-semibold"
                    style={{ backgroundColor: plan.tier === "gold" ? plan.color : undefined }}
                    variant={plan.tier !== "gold" ? "default" : undefined}
                  >
                    Enroll — {plan.name}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto mt-10 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-2">
          <p className="font-semibold">Texas Notary Fee Disclosure</p>
          <p>
            The State of Texas sets the maximum fee a notary public may charge per notarial act.
            LBS does not provide legal advice, select notarial certificates on behalf of clients, or
            notarize documents it has reason to believe are fraudulent. By enrolling, your company
            acknowledges these restrictions.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0d1b35] mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border/50 pb-6">
                <h3 className="font-semibold text-[#0d1b35] mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 px-6 bg-[#0d1b35]">
        <div className="max-w-2xl mx-auto text-center text-white space-y-5">
          <h2 className="text-2xl font-bold">Questions? Let's Talk.</h2>
          <p className="text-white/70">
            Our team is happy to help you choose the right plan or answer questions about the enrollment process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="tel:2818365357" className="flex items-center justify-center gap-2 text-white/80 hover:text-white transition-colors">
              <Phone className="w-4 h-4" /> (281) 836-5357
            </a>
            <a href="mailto:info@lbsconnect.net" className="flex items-center justify-center gap-2 text-white/80 hover:text-white transition-colors">
              <Mail className="w-4 h-4" /> info@lbsconnect.net
            </a>
          </div>
          <Link href="/corporate/enroll">
            <Button className="bg-[#c9a84c] hover:bg-[#b8973b] text-[#0d1b35] font-bold px-8 py-5 text-sm">
              Start Enrollment
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
