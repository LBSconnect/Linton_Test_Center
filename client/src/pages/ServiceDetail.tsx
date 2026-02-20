import { useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Loader2,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { getServiceBySlug } from "@/lib/services";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug || "");
  const { toast } = useToast();

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payNow, setPayNow] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    data: Array<{
      id: string;
      name: string;
      description: string;
      prices: Array<{
        id: string;
        unit_amount: number;
        currency: string;
        recurring: any;
      }>;
    }>;
  }>({
    queryKey: ["/api/products-with-prices"],
  });

  // Fetch available time slots for selected date
  const { data: slotsData, isLoading: slotsLoading } = useQuery<{
    slots: string[];
    businessHours: { start: string; end: string };
    daysOpen: string[];
  }>({
    queryKey: ["/api/appointments/available-slots", selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return { slots: [], businessHours: { start: "08:00", end: "16:00" }, daysOpen: [] };
      const res = await fetch(`/api/appointments/available-slots?date=${selectedDate.toISOString()}`);
      return res.json();
    },
    enabled: !!selectedDate,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json();
    },
    onSuccess: (data: { success: boolean; checkoutUrl?: string; message?: string }) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setBookingSuccess(true);
        toast({
          title: "Appointment Booked!",
          description: "You will receive a confirmation email shortly.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Error",
        description: error.message || "Unable to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Service Not Found</h1>
            <p className="text-muted-foreground">
              The service you're looking for doesn't exist.
            </p>
            <Link href="/services">
              <Button data-testid="button-back-services">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const matchingProduct = productsData?.data?.find(
    (p) =>
      p.name.toLowerCase().includes(service.shortTitle.toLowerCase()) ||
      service.stripeProductName.toLowerCase() === p.name.toLowerCase()
  );

  const price = matchingProduct?.prices?.[0];

  // Disable Sundays in calendar (Saturdays are now open)
  const disabledDays = (date: Date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day === 0 || date < today; // Only disable Sunday
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !customerName || !customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a date and time.",
        variant: "destructive",
      });
      return;
    }

    const appointmentData = {
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      serviceName: service.title,
      serviceId: matchingProduct?.id,
      priceId: price?.id,
      priceAmount: price?.unit_amount,
      appointmentDate: selectedTime,
      payNow: payNow && !!price,
      notes: notes || undefined,
    };

    bookingMutation.mutate(appointmentData);
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-md px-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Appointment Booked!</h1>
            <p className="text-muted-foreground">
              Your appointment for <span className="font-semibold">{service.title}</span> has been confirmed.
              A confirmation email has been sent to <span className="font-semibold">{customerEmail}</span>.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p><span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p><span className="font-medium">Time:</span> {formatTime(selectedTime)}</p>
              <p><span className="font-medium">Payment:</span> {payNow ? "Paid Online" : "Pay at Visit"}</p>
            </div>
            <Link href="/services">
              <Button className="mt-4">
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-20 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${service.image})` }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Link href="/services">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Services
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
              <service.icon className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <h1
                className="text-3xl md:text-4xl font-bold text-white"
                data-testid="text-detail-title"
              >
                {service.title}
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                {service.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-md overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-64 md:h-80 object-cover"
                  data-testid="img-service-detail"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold" data-testid="text-about-heading">
                  About This Service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {service.longDescription}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="text-3xl font-bold text-[#1e3a6e] dark:text-white">
                      {price ? `$${(price.unit_amount / 100).toFixed(2)}` : service.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {service.priceLabel}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-5">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-[#e85d40]" />
                      Book an Appointment
                    </h3>

                    <div className="space-y-4">
                      {/* Date Picker */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                        <div className="border rounded-md p-2">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setSelectedTime("");
                            }}
                            disabled={disabledDays}
                            className="rounded-md"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Available Monday - Saturday
                        </p>
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Select Time</Label>
                          {slotsLoading ? (
                            <div className="grid grid-cols-3 gap-2">
                              {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-10" />
                              ))}
                            </div>
                          ) : slotsData?.slots && slotsData.slots.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {slotsData.slots.map((slot) => (
                                <Button
                                  key={slot}
                                  variant={selectedTime === slot ? "default" : "outline"}
                                  size="sm"
                                  className={selectedTime === slot ? "bg-[#1e3a6e]" : ""}
                                  onClick={() => setSelectedTime(slot)}
                                >
                                  {formatTime(slot)}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No available slots for this date.
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Mon-Thu: 8AM-4PM | Fri: 8AM-5PM | Sat: 9AM-5PM
                          </p>
                        </div>
                      )}

                      {/* Customer Info */}
                      {selectedTime && (
                        <>
                          <div className="border-t border-border/50 pt-4 space-y-3">
                            <div>
                              <Label htmlFor="name" className="text-sm">Full Name *</Label>
                              <Input
                                id="name"
                                placeholder="Your full name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="email" className="text-sm">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone" className="text-sm">Phone (Optional)</Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="(123) 456-7890"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Any special requests or notes..."
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Payment Option */}
                          {price && (
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-[#e85d40]" />
                                <span className="text-sm font-medium">Pay online now</span>
                              </div>
                              <Switch
                                checked={payNow}
                                onCheckedChange={setPayNow}
                              />
                            </div>
                          )}

                          {/* Book Button */}
                          <Button
                            className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                            onClick={handleBookAppointment}
                            disabled={bookingMutation.isPending}
                          >
                            {bookingMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Booking...
                              </>
                            ) : payNow && price ? (
                              <>
                                Book & Pay ${(price.unit_amount / 100).toFixed(2)}
                              </>
                            ) : (
                              "Book Appointment"
                            )}
                          </Button>

                          {!payNow && (
                            <p className="text-xs text-center text-muted-foreground">
                              Payment will be collected at the time of your visit
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-4">
                    <h3 className="font-semibold text-sm">Visit Us</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#e85d40]" />
                        <span>
                          616 FM 1960 Rd W, Suite 575
                          <br />
                          Houston, TX 77090
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0 text-[#e85d40]" />
                        <a href="tel:2818365357">(281) 836-5357</a>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#e85d40]" />
                        <span>
                          Mon - Thu: 8 AM - 4 PM
                          <br />
                          Fri: 8 AM - 5 PM
                          <br />
                          Sat: 9 AM - 5 PM
                        </span>
                      </div>
                    </div>
                  </div>
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
