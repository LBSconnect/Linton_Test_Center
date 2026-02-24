import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-16 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <FileText className="w-4 h-4 text-[#f07050]" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Terms of Use
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
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Use ("Terms") constitute a legally binding agreement between you and Linton Business
                Solutions LLC, doing business as LBS Test & Exam Center ("LBS," "we," "us," or "our"), governing
                your access to and use of our website at www.lbs4.com and our services provided at our Houston, Texas location.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By accessing our website or using our services, you acknowledge that you have read, understood, and
                agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use
                our website or services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Services Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                LBS Test & Exam Center provides the following services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Certiport Exam Testing:</strong> Authorized testing center for Pearson VUE, Certiport, PMI, and other certification programs</li>
                <li><strong>Private Exam Testing:</strong> Private proctoring rooms with equipment for remotely proctored exams</li>
                <li><strong>Computer Workstation Rental:</strong> Fully equipped workstations with high-speed internet access</li>
                <li><strong>Notary Services:</strong> Certified notary public services for documents and legal papers</li>
                <li><strong>Passport Photos:</strong> Professional photos meeting government standards for passports and visas</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Appointment Scheduling and Cancellation</h2>

              <h3 className="text-lg font-semibold">Scheduling</h3>
              <p className="text-muted-foreground leading-relaxed">
                Appointments can be scheduled through our website or by contacting us directly. By scheduling an
                appointment, you agree to arrive at the scheduled time and comply with all applicable requirements
                for your service.
              </p>

              <h3 className="text-lg font-semibold mt-4">Cancellation Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you need to cancel or reschedule an appointment, please contact us as soon as possible. Cancellation
                policies may vary depending on the service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Certification Exams:</strong> Subject to the policies of the respective testing organization (Pearson VUE, Certiport, etc.). Fees may apply for late cancellations.</li>
                <li><strong>Other Services:</strong> We request at least 24 hours notice for cancellations. Prepaid services may be rescheduled or refunded at our discretion.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">No-Shows</h3>
              <p className="text-muted-foreground leading-relaxed">
                Failure to appear for a scheduled appointment without prior notice may result in forfeiture of prepaid
                fees. For certification exams, no-shows are subject to the testing organization's policies.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Certification Exam Requirements</h2>
              <p className="text-muted-foreground leading-relaxed">
                For certification exam testing, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Present valid, unexpired government-issued photo identification</li>
                <li>Arrive at least 15-30 minutes before your scheduled exam time</li>
                <li>Comply with the testing organization's rules and policies</li>
                <li>Refrain from bringing prohibited items into the testing area (cell phones, smart watches, notes, etc.)</li>
                <li>Follow all instructions provided by testing center staff</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Failure to comply with exam requirements may result in denial of testing, exam invalidation, or
                reporting to the testing organization.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Proctoring Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                When using our remote proctoring services, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Follow all rules established by your exam provider</li>
                <li>Consent to video and audio monitoring during your exam session</li>
                <li>Not engage in any form of cheating or exam misconduct</li>
                <li>Use only authorized materials and resources</li>
                <li>Maintain a quiet, distraction-free environment during your session</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate a proctoring session if misconduct is observed or suspected.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Notary Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our notary services are provided in accordance with Texas law. By using our notary services, you:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Certify that you are signing documents voluntarily and of your own free will</li>
                <li>Agree to present valid identification as required by law</li>
                <li>Understand that the notary is prohibited from providing legal advice</li>
                <li>Acknowledge that the notary may refuse to notarize documents if requirements are not met</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Payment Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Payment is required at the time of service or as specified during booking. We accept major credit
                cards and process payments securely through Stripe. By making a payment, you agree to Stripe's
                terms of service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Prices are subject to change without notice. The price displayed at the time of booking will be
                honored for that transaction.
              </p>

              <h3 className="text-lg font-semibold mt-4">Refunds</h3>
              <p className="text-muted-foreground leading-relaxed">
                Refund eligibility varies by service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Certification Exams:</strong> Governed by the testing organization's refund policy</li>
                <li><strong>Prepaid Services:</strong> May be refunded or applied to a future appointment at our discretion if cancelled with adequate notice</li>
                <li><strong>Completed Services:</strong> Generally non-refundable once the service has been rendered</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed">
                When visiting our facility or using our website, you agree not to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Engage in any disruptive, threatening, or harassing behavior</li>
                <li>Damage, tamper with, or misuse our equipment or facilities</li>
                <li>Access areas of our facility without authorization</li>
                <li>Use our services for any unlawful purpose</li>
                <li>Interfere with other customers or their testing sessions</li>
                <li>Attempt to circumvent security measures on our website or systems</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to refuse service to anyone who violates these terms or engages in inappropriate conduct.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on our website, including text, graphics, logos, images, and software, is the property
                of Linton Business Solutions LLC or its content suppliers and is protected by copyright and trademark
                laws. You may not reproduce, distribute, modify, or create derivative works from any content without
                our express written permission.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Pearson VUE, Certiport, PMI, and other certification program names and logos are trademarks of their
                respective owners.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                OUR WEBSITE AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
                INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We do not warrant that our website will be uninterrupted, error-free, or free of viruses or other
                harmful components.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LINTON BUSINESS SOLUTIONS LLC AND ITS OFFICERS, DIRECTORS,
                EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF
                OR RELATED TO YOUR USE OF OUR WEBSITE OR SERVICES.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our total liability for any claim arising from these Terms or your use of our services shall not
                exceed the amount you paid for the specific service giving rise to the claim.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Linton Business Solutions LLC, its officers,
                directors, employees, agents, and affiliates from and against any claims, liabilities, damages,
                losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to
                your violation of these Terms or your use of our services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services may involve third-party providers, including testing organizations and payment processors.
                Your use of third-party services is subject to their respective terms and conditions. We are not
                responsible for the actions, content, or policies of third parties.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of Texas,
                without regard to its conflict of law provisions. Any disputes arising under these Terms shall be
                resolved exclusively in the state or federal courts located in Harris County, Texas.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon
                posting to our website. Your continued use of our website or services after any changes constitutes
                acceptance of the modified Terms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
                limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain
                in full force and effect.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1e3a6e] dark:text-white">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Use, please contact us:
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
