import { Link } from "wouter";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

export default function Footer() {
  const serviceLinks = [
    { href: "/services/computer-workstation-rental", label: "Computer Workstation Rental" },
    { href: "/services/notary-service", label: "Notary Service" },
    { href: "/services/passport-photos", label: "Passport Photos" },
    { href: "/services/remote-proctoring", label: "Remote Proctoring" },
    { href: "/services/certification-exam-testing", label: "Certification Exams" },
  ];

  return (
    <footer className="bg-[#1a2d52] text-white/90">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="LBS Logo"
                className="h-12 w-12 object-contain rounded-md bg-white/10 p-1"
              />
              <div>
                <h3 className="text-lg font-bold text-white">LBS</h3>
                <p className="text-xs text-white/60">Test & Exam Center</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              LBS is a skilling division of Linton Business Solutions LLC (LBS). Your trusted
              partner for professional testing and business services in Houston,
              Texas.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Our Services" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className="text-sm text-white/70 cursor-pointer transition-colors hover:text-white"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Our Services
            </h4>
            <nav className="flex flex-col gap-2.5">
              {serviceLinks.map((service) => (
                <Link key={service.href} href={service.href}>
                  <span
                    className="text-sm text-white/70 cursor-pointer transition-colors hover:text-white"
                    data-testid={`link-footer-service-${service.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {service.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Contact Info
            </h4>
            <div className="space-y-3">
              <a
                href="https://maps.google.com/?q=616+FM+1960+Road+West+Suite+575+Houston+TX+77090"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-address"
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#f07050]" />
                <span>
                  616 FM 1960 Rd W<br />
                  Suite 575<br />
                  Houston, TX 77090
                </span>
              </a>
              <a
                href="tel:2818365357"
                className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-phone"
              >
                <Phone className="w-4 h-4 shrink-0 text-[#f07050]" />
                (281) 836-5357
              </a>
              <a
                href="mailto:info@lbsconnect.net"
                className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-email"
              >
                <Mail className="w-4 h-4 shrink-0 text-[#f07050]" />
                info@lbsconnect.net
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/70">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#f07050]" />
                <span>
                  Mon - Thu: 8:00 AM - 4:00 PM<br />
                  Fri: 8:00 AM - 5:00 PM<br />
                  Sat: 9:00 AM - 5:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Linton Business Solutions LLC (LBS). All rights reserved.</p>
          <p>LBS - Test & Exam Center Division</p>
        </div>
      </div>
    </footer>
  );
}
