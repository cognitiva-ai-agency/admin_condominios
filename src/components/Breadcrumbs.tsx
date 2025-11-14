"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex items-center gap-2 text-sm">
        {/* Inicio siempre presente */}
        <li className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Inicio"
          >
            <Home className="h-4 w-4" />
          </Link>
          {items.length > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate max-w-[150px] sm:max-w-[250px]",
                    isLast ? "text-gray-900 font-semibold" : "text-gray-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 text-gray-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
