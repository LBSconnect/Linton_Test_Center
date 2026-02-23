import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-16 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <Shield className="w-4 h-4 text-[#f07050]" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Privacy Policy
          </h1>
          <p className="text-white/80">
            Last Updated: February 2025
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Linton Business Solutions LLC, doing business as LBS Test & Exam Center ("LBS," "we," "us," or "our"),
                is committed to protecting your privacy and personal information. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you visit our website at www.lbs4.com or
                use our services at our Houston, Texas location.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By accessing our website or using our services, you agree to this Privacy Policy. If you do not agree
                with the terms of this Privacy Policy, please do not access the site or use our services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Information We Collect</h2>

              <h3 className="text-lg font-semibold">Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Schedule an appointment for testing, proctoring, notary, passport photos, or workstation rental</li>
                <li>Register for a certification exam through our testing center</li>
                <li>Contact us through our website, phone, or email</li>
                <li>Complete a transaction or make a payment</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                This information may include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Government-issued identification (required for testing and notary services)</li>
                <li>Payment information (credit card numbers are processed securely through Stripe)</li>
                <li>Appointment preferences and scheduling information</li>
                <li>Communication records and correspondence</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you visit our website, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Process appointments and deliver our services</li>
                <li>Administer certification exams on behalf of testing organizations (Pearson VUE, Certiport, PMI, etc.)</li>
                <li>Provide remote proctoring services with appropriate monitoring</li>
                <li>Process notary services in compliance with Texas law</li>
                <li>Produce passport and visa photos meeting government standards</li>
                <li>Process payments and send confirmations</li>
                <li>Communicate with you about your appointments and services</li>
                <li>Respond to inquiries and provide customer support</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Testing and Proctoring Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                As an authorized testing center for various certification programs, we are required to collect and
                share certain information with testing organizations. This may include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Identity verification information</li>
                <li>Test registration and scheduling data</li>
                <li>Test scores and results (transmitted directly to the testing organization)</li>
                <li>Proctoring records and session monitoring data</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                For remote proctoring services, video and audio monitoring may be conducted during your exam session
                to ensure exam integrity. This data is handled in accordance with the testing organization's policies.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Testing Organizations:</strong> Pearson VUE, Certiport, PMI, and other certification bodies as required for exam administration</li>
                <li><strong>Payment Processors:</strong> Stripe for secure payment processing</li>
                <li><strong>Service Providers:</strong> Third parties who assist us in operating our website and services</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Secure socket layer (SSL) encryption for data transmission</li>
                <li>Secure payment processing through PCI-compliant providers</li>
                <li>Access controls limiting employee access to personal information</li>
                <li>Regular security assessments and updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                However, no method of transmission over the Internet or electronic storage is 100% secure, and we
                cannot guarantee absolute security.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may use cookies and similar tracking technologies to enhance your browsing experience.
                Cookies are small files stored on your device that help us:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Remember your preferences</li>
                <li>Understand how you use our website</li>
                <li>Improve our services</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                You can control cookies through your browser settings. Disabling cookies may affect some website functionality.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>The right to access the personal information we hold about you</li>
                <li>The right to request correction of inaccurate information</li>
                <li>The right to request deletion of your information (subject to legal retention requirements)</li>
                <li>The right to opt out of certain communications</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes for which it
                was collected, including to satisfy legal, accounting, or reporting requirements. Retention periods
                may vary based on the type of information and applicable legal obligations.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not directed to individuals under the age of 13. We do not knowingly collect
                personal information from children under 13. If you believe we have collected information from a
                child under 13, please contact us immediately.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an
                updated "Last Updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-muted/30 rounded-lg p-6 space-y-2">
                <p className="font-semibold text-[#1e3a6e] dark:text-white">Linton Business Solutions LLC</p>
                <p className="text-muted-foreground">DBA: LBS Test & Exam Center</p>
                <p className="text-muted-foreground">616 FM 1960 Road West, Suite 575</p>
                <p className="text-muted-foreground">Houston, TX 77090</p>
                <p className="text-muted-foreground">Phone: (281) 836-5357</p>
                <p className="text-muted-foreground">Email: info@lbsconnect.net</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
