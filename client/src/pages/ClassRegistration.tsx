import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Clock, Users, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { CLASS_DEFINITIONS, formatClassTime, isValidClassType } from "@shared/classes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SessionCount {
  registrationCount: number;
  availableSpots: number;
  isFull: boolean;
}

function friendlyDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function ClassRegistration() {
  const { classType, date } = useParams<{ classType: string; date: string }>();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const validType = classType && isValidClassType(classType);
  const classDef = validType ? CLASS_DEFINITIONS[classType] : null;

  const { data: countData, isLoading: countLoading } = useQuery<SessionCount>({
    queryKey: ["/api/classes/session-count", classType, date],
    queryFn: async () => {
      const res = await fetch(`/api/classes/session-count?classType=${classType}&classDate=${date}`);
      if (!res.ok) throw new Error("Failed to load session info");
      return res.json();
    },
    enabled: !!validType && !!date,
    refetchInterval: 30000, // refresh every 30s
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/classes/register", {
        classType,
        classDate: date,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
      });
      return await res.json();
    },
    onSuccess: (data: { checkoutUrl?: string }) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Error",
        description: error.message || "Unable to complete registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name || !email || !phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate();
  };

  if (!validType || !classDef) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Class Not Found</h1>
            <Link href="/calendar"><Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Calendar</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isFull = countData?.isFull ?? false;
  const availableSpots = countData?.availableSpots ?? 20;
  const isPastDate = date ? new Date(date) < new Date(new Date().toDateString()) : false;
  const isLI = classType === "life-insurance";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative py-14 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-white/80 mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />Back to Calendar
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white max-w-2xl">{classDef.title}</h1>
          <p className="text-white/80 mt-2">Register and pay online to secure your spot.</p>
        </div>
      </section>

      <section className="py-12 bg-background flex-1">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Session details */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center ${isLI ? "bg-blue-100 dark:bg-blue-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                    <Users className={`w-6 h-6 ${isLI ? "text-blue-700" : "text-orange-600"}`} />
                  </div>
                  <h2 className="font-semibold text-lg leading-snug">{classDef.title}</h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{date ? friendlyDate(date) : "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{formatClassTime(classDef.startTime)} – {formatClassTime(classDef.endTime)} CT · {classDef.durationHours} hrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 shrink-0" />
                      {countLoading
                        ? <span>Checking availability…</span>
                        : isFull
                        ? <span className="text-destructive font-medium">Session Full</span>
                        : <span>{availableSpots} spot{availableSpots !== 1 ? "s" : ""} remaining</span>
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <span className="text-lg font-bold text-[#1e3a6e] dark:text-white">
                        ${(classDef.priceAmount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Sessions are held onsite at LBS Test &amp; Exam Center, 616 FM 1960 Rd W Suite 575, Houston, TX 77090.</p>
                </CardContent>
              </Card>
            </div>

            {/* Registration form */}
            <div className="lg:col-span-3">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  {(isFull || isPastDate) ? (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg text-destructive">
                      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">{isPastDate ? "This session has passed" : "Session is full"}</p>
                        <p className="text-sm mt-1">
                          {isPastDate ? "Please select an upcoming session from the calendar." : "Please choose another date from the calendar."}
                        </p>
                        <Link href="/calendar">
                          <Button size="sm" variant="outline" className="mt-3">View Calendar</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Your Information</h3>
                        <p className="text-sm text-muted-foreground">You'll be redirected to Stripe to complete payment.</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="name" className="text-sm">Full Name *</Label>
                          <Input id="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm">Email Address *</Label>
                          <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                          <Input id="phone" type="tel" placeholder="(123) 456-7890" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                        onClick={handleSubmit}
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
                        ) : (
                          `Register & Pay $${(classDef.priceAmount / 100).toFixed(2)}`
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Secure payment via Stripe. A confirmation email will be sent after payment.
                      </p>
                    </>
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
