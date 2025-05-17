import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export interface NavigationItemProps {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NavigationItem({
  title,
  href,
  description,
  icon, // Icon nie jest jeszcze używane, ale jest w propsach
  className,
}: NavigationItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "block hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
        className
      )}
    >
      <Card className="h-full flex flex-col transition-all duration-150 ease-in-out hover:shadow-lg hover:border-primary/60 focus-within:shadow-lg focus-within:border-primary/60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        {description && (
          <CardContent className="flex-grow">
            <CardDescription className="text-sm">{description}</CardDescription>
          </CardContent>
        )}
        {!description && (
          <CardContent className="flex-grow" /> // Ensure consistent height if no description
        )}
        <CardFooter>
          {/* Można tu dodać np. strzałkę lub tekst "Przejdź" jeśli będzie potrzebne */}
          {/* Na razie puste, aby zachować czysty wygląd karty */}
        </CardFooter>
      </Card>
    </a>
  );
}
