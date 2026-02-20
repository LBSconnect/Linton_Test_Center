import { useParams } from "wouter";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";
import { getServiceBySlug } from "@/lib/services";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug || "");
  const { toast } = useToast();

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

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/checkout", { priceId });
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message || "Unable to start checkout. Please try again.",
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

  const handleBookNow = (priceId: string) => {
    checkoutMutation.mutate(priceId);
  };

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
              <Card className="border-border/50 sticky top-24">
                <CardContent className="p-6 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="text-3xl font-bold text-[#1e3a6e] dark:text-white">
                      {service.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {service.priceLabel}
                    </div>
                  </div>

                  {productsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : matchingProduct && matchingProduct.prices.length > 0 ? (
                    <div className="space-y-3">
                      {matchingProduct.prices.map((price) => (
                        <Button
                          key={price.id}
                          className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                          onClick={() => handleBookNow(price.id)}
                          disabled={checkoutMutation.isPending}
                          data-testid={`button-purchase-${price.id}`}
                        >
                          {checkoutMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Purchase - $
                              {(price.unit_amount / 100).toFixed(2)}
                              {price.recurring ? `/${price.recurring.interval}` : ""}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <a href="tel:2818365357">
                        <Button
                          className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                          data-testid="button-call-to-book"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call to Book
                        </Button>
                      </a>
                      <a href="mailto:info@lbsconnect.net">
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          data-testid="button-email-to-book"
                        >
                          Email to Schedule
                        </Button>
                      </a>
                    </div>
                  )}

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
                          Mon - Fri: 9 AM - 6 PM
                          <br />
                          Sat: 10 AM - 4 PM
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
