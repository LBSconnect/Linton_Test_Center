import { useState, useEffect } from "react";
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

interface UpcomingSession {
  date: string;
  dayOfWeek: "Friday" | "Saturday";
  startTime: string;
  endTime: string;
  registrationCount: number;
  availableSpots: number;
}

interface UpcomingResponse {
  sessions: UpcomingSession[];
  classType: string;
  title: string;
}

function friendlyDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function ClassRegistration() {
  const { classType, date: dateParam } = useParams<{ classType: string; date?: string }>();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(dateParam ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const validType = classType && isValidClassType(classType);
  const classDef = validType ? CLASS_DEFINITIONS[classType] : null;
  const isLI = classType === "life-insurance";

  // Fetch upcoming available sessions for this class type
  const { data: upcomingData, isLoading: sessionsLoading } = useQuery<UpcomingResponse>({
    queryKey: ["/api/classes/upcoming-sessions", classType],
    queryFn: async () => {
      const res = await fetch(`/api/classes/upcoming-sessions?classType=${classType}&weeks=10`);
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
    enabled: !!validType,
  });

  // Pre-select date from URL only once sessions are loaded, if that date is available
  useEffect(() => {
    if (!dateParam || !upcomingData) return;
    const available = upcomingData.sessions.some(s => s.date === dateParam);
    if (available) setSelectedDate(dateParam);
    else setSelectedDate(""); // date from URL is full/past — don't pre-select
  }, [dateParam, upcomingData]);

  const selectedSession = upcomingData?.sessions.find(s => s.date === selectedDate);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/classes/register", {
        classType,
        classDate: selectedDate,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      return json;
    },
    onSuccess: (data: { checkoutUrl?: string }) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
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
    if (!selectedDate) {
      toast({ title: "No date selected", description: "Please choose a session date.", variant: "destructive" });
      return;
    }
    if (!name || !email || !phone) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
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
          <p className="text-white/80 mt-2">
            {formatClassTime(classDef.startTime)} – {formatClassTime(classDef.endTime)} CT · $75 per session
          </p>
        </div>
      </section>

      <section className="py-12 bg-background flex-1">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Left: session picker + details */}
            <div className="lg:col-span-2 space-y-4">

              {/* Select a date */}
              <Card className="border-border/50">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#e85d40]" />
                    Select a Date
                  </h3>

                  {sessionsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading available dates…</p>
                  ) : !upcomingData?.sessions.length ? (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>No upcoming sessions available. Please check back later.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {upcomingData.sessions.map(s => {
                        const isSelected = selectedDate === s.date;
                        return (
                          <button
                            key={s.date}
                            onClick={() => setSelectedDate(s.date)}
                            className={`w-full text-left rounded-md border px-3 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? "border-[#1e3a6e] bg-[#1e3a6e]/5 dark:border-blue-400 dark:bg-blue-900/20"
                                : "border-border hover:border-[#1e3a6e]/50 hover:bg-muted/30"
                            }`}
                          >
                            <div className="font-medium">{friendlyDate(s.date)}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatClassTime(s.startTime)} – {formatClassTime(s.endTime)} CT
                              <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                {s.availableSpots} spot{s.availableSpots !== 1 ? "s" : ""} left
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session details (shown once a date is selected) */}
              {selectedSession && (
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Session Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{friendlyDate(selectedSession.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatClassTime(selectedSession.startTime)} – {formatClassTime(selectedSession.endTime)} CT · 2 hrs</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {selectedSession.availableSpots} spot{selectedSession.availableSpots !== 1 ? "s" : ""} remaining
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="text-lg font-bold text-[#1e3a6e] dark:text-white">
                          ${(classDef.priceAmount / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Onsite · 616 FM 1960 Rd W Suite 575, Houston, TX 77090
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: registration form */}
            <div className="lg:col-span-3">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  {!selectedDate ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 text-muted-foreground">
                      <Calendar className="w-10 h-10 opacity-30" />
                      <p className="font-medium">Select an available date to continue</p>
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
