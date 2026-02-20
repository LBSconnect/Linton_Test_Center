import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  price?: string;
  priceLabel?: string;
  slug: string;
  icon?: React.ReactNode;
}

export default function ServiceCard({
  title,
  description,
  image,
  price,
  priceLabel,
  slug,
  icon,
}: ServiceCardProps) {
  return (
    <Card
      className="group border-border/50 bg-card transition-all duration-300 hover-elevate"
      data-testid={`card-service-${slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-md">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {price && (
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-md px-3 py-1.5 shadow-sm">
            <span className="text-lg font-bold text-[#1e3a6e] dark:text-white">
              {price}
            </span>
            {priceLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {priceLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="shrink-0 w-10 h-10 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center text-[#1e3a6e] dark:text-[#6b9aed]">
              {icon}
            </div>
          )}
          <div className="space-y-1.5 min-w-0">
            <h3
              className="font-semibold text-lg leading-tight"
              data-testid={`text-service-title-${slug}`}
            >
              {title}
            </h3>
            <p
              className="text-sm text-muted-foreground leading-relaxed line-clamp-2"
              data-testid={`text-service-desc-${slug}`}
            >
              {description}
            </p>
          </div>
        </div>
        <Link href={`/services/${slug}`}>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 group/btn"
            data-testid={`button-learn-more-${slug}`}
          >
            Learn More & Book
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
