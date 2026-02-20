import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Declare global grecaptcha
declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  // Load reCAPTCHA script
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn("RECAPTCHA_SITE_KEY not configured");
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="recaptcha"]')) {
      if (window.grecaptcha && window.grecaptcha.render) {
        renderCaptcha();
      }
      return;
    }

    window.onRecaptchaLoad = () => {
      setCaptchaLoaded(true);
      renderCaptcha();
    };

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      window.onRecaptchaLoad = () => {};
    };
  }, []);

  const renderCaptcha = () => {
    if (captchaRef.current && window.grecaptcha && window.grecaptcha.render) {
      try {
        // Clear any existing captcha
        captchaRef.current.innerHTML = "";
        window.grecaptcha.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
        });
      } catch (e) {
        // Captcha might already be rendered
      }
    }
  };

  useEffect(() => {
    if (captchaLoaded) {
      renderCaptcha();
    }
  }, [captchaLoaded]);

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData & { captchaToken?: string }) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Reset captcha on error
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
      setCaptchaToken(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check captcha if configured
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      toast({
        title: "Please complete the captcha",
        description: "Verify that you are not a robot.",
        variant: "destructive",
      });
      return;
    }

    contactMutation.mutate({
      ...formData,
      captchaToken: captchaToken || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-20 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]" data-testid="section-contact-hero">
        <div className="absolute inset-0 bg-[url('/images/hero-testing-center.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="text-contact-title">
            Contact Us
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Have questions or ready to schedule? We're here to help. Reach out
            to us today.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background" data-testid="section-contact-content">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Get In Touch</h2>
                <p className="text-muted-foreground">
                  Whether you need to schedule an exam, inquire about our
                  services, or have a question, we'd love to hear from you.
                </p>
              </div>

              <div className="space-y-5">
                <a
                  href="https://maps.google.com/?q=616+FM+1960+Road+West+Suite+575+Houston+TX+77090"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-md bg-muted/30 transition-colors hover:bg-muted/50"
                  data-testid="link-contact-address"
                >
                  <div className="w-12 h-12 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Location</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      616 FM 1960 Road West
                      <br />
                      Suite 575
                      <br />
                      Houston, Texas 77090
                    </p>
                  </div>
                </a>

                <a
                  href="tel:2818365357"
                  className="flex items-start gap-4 p-4 rounded-md bg-muted/30 transition-colors hover:bg-muted/50"
                  data-testid="link-contact-phone"
                >
                  <div className="w-12 h-12 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Phone</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      (281) 836-5357
                    </p>
                  </div>
                </a>

                <a
                  href="mailto:info@lbsconnect.net"
                  className="flex items-start gap-4 p-4 rounded-md bg-muted/30 transition-colors hover:bg-muted/50"
                  data-testid="link-contact-email"
                >
                  <div className="w-12 h-12 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      info@lbsconnect.net
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 rounded-md bg-muted/30">
                  <div className="w-12 h-12 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Business Hours</h3>
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      <p>Monday - Thursday: 8:00 AM - 4:00 PM</p>
                      <p>Friday: 8:00 AM - 5:00 PM</p>
                      <p>Saturday: 9:00 AM - 5:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md overflow-hidden border border-border/50 h-64">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.123456789!2d-95.4567890!3d29.9876543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s616+FM+1960+Rd+W+Suite+575+Houston+TX+77090!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="LBS Location"
                  data-testid="map-iframe"
                />
              </div>
            </div>

            <div>
              <Card className="border-border/50">
                <CardContent className="p-6 md:p-8">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4" data-testid="div-form-success">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold">Message Sent!</h3>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll get back to you as
                        soon as possible.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                          setCaptchaToken(null);
                          setFormData({
                            name: "",
                            email: "",
                            phone: "",
                            service: "",
                            message: "",
                          });
                          // Re-render captcha
                          setTimeout(() => renderCaptcha(), 100);
                        }}
                        data-testid="button-send-another"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-contact">
                      <h2 className="text-2xl font-bold">Send Us a Message</h2>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          data-testid="input-name"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@email.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                            data-testid="input-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(xxx) xxx-xxxx"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            data-testid="input-phone"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Service of Interest</Label>
                        <Select
                          value={formData.service}
                          onValueChange={(val) =>
                            setFormData({ ...formData, service: val })
                          }
                        >
                          <SelectTrigger data-testid="select-service">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workstation">
                              Computer Workstation Rental
                            </SelectItem>
                            <SelectItem value="notary">
                              Notary Service
                            </SelectItem>
                            <SelectItem value="passport">
                              Passport Photos
                            </SelectItem>
                            <SelectItem value="proctoring">
                              Remote Proctoring Services
                            </SelectItem>
                            <SelectItem value="certification">
                              Certification Exam Testing
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="How can we help you?"
                          rows={5}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          required
                          data-testid="input-message"
                        />
                      </div>

                      {/* reCAPTCHA */}
                      {RECAPTCHA_SITE_KEY && (
                        <div className="flex justify-center">
                          <div ref={captchaRef} data-testid="recaptcha-container" />
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                        disabled={contactMutation.isPending || (RECAPTCHA_SITE_KEY ? !captchaToken : false)}
                        data-testid="button-submit-contact"
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
