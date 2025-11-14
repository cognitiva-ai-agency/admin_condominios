"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, LucideIcon } from "lucide-react";

interface StatCardData {
  title: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  trend?: string;
}

interface StatsCarouselProps {
  stats: StatCardData[];
  loading?: boolean;
}

export default function StatsCarousel({ stats, loading = false }: StatsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(stats.length / 2);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.offsetWidth;
      const page = Math.round(scrollLeft / cardWidth);
      setCurrentPage(page);
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToPage = (page: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const cardWidth = carousel.offsetWidth;
    carousel.scrollTo({
      left: page * cardWidth,
      behavior: "smooth",
    });
  };

  const StatCard = ({ data }: { data: StatCardData }) => {
    const Icon = data.icon;

    return (
      <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
        <CardContent className="p-0">
          <div className={`${data.gradient} p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
                  {data.title}
                </p>
                {loading ? (
                  <Skeleton className="h-10 w-20 mt-2 bg-white/20" />
                ) : (
                  <p className="text-3xl font-bold mt-1">{data.value}</p>
                )}
                {data.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-medium">{data.trend}</span>
                  </div>
                )}
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                <Icon className="h-7 w-7" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="relative">
      {/* Mobile Carousel (scroll-snap) */}
      <div className="sm:hidden">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Renderizar en pares para el carousel */}
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div
              key={pageIndex}
              className="flex-shrink-0 w-full snap-start"
            >
              <div className="grid grid-cols-2 gap-3">
                {stats.slice(pageIndex * 2, pageIndex * 2 + 2).map((stat, idx) => (
                  <StatCard key={idx} data={stat} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dot Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToPage(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentPage === index
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Hide scrollbar globally */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
