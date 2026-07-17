import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, Mail, MapPin, ChevronDown, Building2 } from "lucide-react";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

const CORPORATE_ENABLED = import.meta.env.VITE_CORPORATE_ENABLED === "true";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const corporateMainLinks = [
  { href: "/corporate", label: "Overview" },
  { href: "/corporate/programs", label: "Plans & Pricing" },
  { href: "/corporate/enroll", label: "Enroll Now" },
];

const corporateAccountLinks = [
  { href: "/corporate/portal", label: "Client Portal", bg: "bg-[#c9a84c] hover:bg-[#b8973b]", text: "text-[#0d1b35] font-semibold" },
  { href: "/admin/corporate", label: "Admin Dashboard", bg: "bg-[#0d1b35] hover:bg-[#1a2d52]", text: "text-white font-semibold" },
];

export default function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [corpOpen, setCorpOpen] = useState(false);
  const corpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (corpRef.current && !corpRef.current.contains(e.target as Node)) {
        setCorpOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#1e3a6e] text-white/90 text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 flex-wrap">
            <a
              href="tel:2818365357"
              className="flex items-center gap-1.5 transition-colors"
              data-testid="link-phone-top"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>(281) 836-5357</span>
            </a>
            <a
              href="mailto:info@lbsconnect.net"
              className="flex items-center gap-1.5 transition-colors"
              data-testid="link-email-top"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>info@lbsconnect.net</span>
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>616 FM 1960 Rd W, Ste 101, Houston, TX 77090-3048</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-background border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                src={logoImg}
                alt="LBS Logo"
                className="h-12 w-12 object-contain rounded-md"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#1e3a6e] dark:text-white leading-tight">
                  LBS
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Test & Exam Center
                </span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "default" : "ghost"}
                  size="sm"
                  className={
                    location === link.href
                      ? "bg-[#1e3a6e] text-white"
                      : "text-foreground"
                  }
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}

            {/* Corporate dropdown — feature gated */}
            {CORPORATE_ENABLED && (
              <div className="relative" ref={corpRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground gap-1"
                  onClick={() => setCorpOpen((o) => !o)}
                  data-testid="link-nav-corporate"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Corporate
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${corpOpen ? "rotate-180" : ""}`} />
                </Button>
                {corpOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border/50 rounded-xl shadow-lg py-1 z-50">
                    {corporateMainLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-[#f8f9fb] cursor-pointer transition-colors"
                          onClick={() => setCorpOpen(false)}
                        >
                          {link.label}
                        </span>
                      </Link>
                    ))}
                    <div className="my-1 border-t border-border/50" />
                    {corporateAccountLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span
                          className={`block mx-2 my-0.5 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${link.bg} ${link.text}`}
                          onClick={() => setCorpOpen(false)}
                        >
                          {link.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <a href="https://www.myeasypass.net" target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground"
                data-testid="link-nav-exam-cram"
              >
                Exam Cram
              </Button>
            </a>
            <Link href="/book">
              <Button
                size="sm"
                className="ml-2 bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                data-testid="button-book-now"
              >
                Book Now
              </Button>
            </Link>
          </nav>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button size="icon" variant="ghost" data-testid="button-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoImg}
                      alt="LBS Logo"
                      className="h-10 w-10 object-contain rounded-md"
                    />
                    <div>
                      <div className="font-bold text-[#1e3a6e] dark:text-white">LBS</div>
                      <div className="text-xs text-muted-foreground">Test & Exam Center</div>
                    </div>
                  </div>
                </div>
                <nav className="flex flex-col p-4 gap-1" data-testid="nav-mobile">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <Button
                        variant={location === link.href ? "default" : "ghost"}
                        className={`w-full justify-start ${location === link.href ? "bg-[#1e3a6e] text-white" : ""}`}
                        onClick={() => setMobileOpen(false)}
                        data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                  {CORPORATE_ENABLED && (
                    <>
                      <div className="pt-2 pb-1 px-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> Corporate
                        </p>
                      </div>
                      {corporateMainLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-sm pl-4"
                            onClick={() => setMobileOpen(false)}
                          >
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                      <div className="my-1 border-t border-border/50" />
                      {corporateAccountLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <Button
                            className={`w-full justify-start text-sm ${link.bg} ${link.text}`}
                            onClick={() => setMobileOpen(false)}
                          >
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                    </>
                  )}
                  <a
                    href="https://www.myeasypass.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      data-testid="link-mobile-exam-cram"
                    >
                      Exam Cram
                    </Button>
                  </a>
                  <Link href="/book">
                    <Button
                      className="w-full mt-3 bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                      onClick={() => setMobileOpen(false)}
                      data-testid="button-mobile-book"
                    >
                      Book Now
                    </Button>
                  </Link>
                </nav>
                <div className="mt-auto p-4 border-t border-border/50 space-y-3 text-sm text-muted-foreground">
                  <a href="tel:2818365357" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> (281) 836-5357
                  </a>
                  <a href="mailto:info@lbsconnect.net" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> info@lbsconnect.net
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
