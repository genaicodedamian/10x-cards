import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface NavigationItemProps {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NavigationItem(props: NavigationItemProps) {
  const { title, href, description, className } = props;
  // props.icon jest dostępne, ale nie jest używane, co powinno być akceptowalne przez linter
  // lub można dodać komentarz ignorujący, jeśli linter nadal zgłasza błąd:

  // const { icon, ...restProps } = props;

  return (
    <a
      href={href}
      className={cn(
        "block hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg group",
        className
      )}
    >
      <Card className="h-full flex flex-col transition-all duration-150 ease-in-out group-hover:shadow-lg group-hover:border-primary/60 focus-within:shadow-lg focus-within:border-primary/60">
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
          {/* The Button and inner <a> tag were causing nested links. */}
          {/* If a footer action is needed, it should not be a link if the card is already a link. */}
          {/* For now, removing the button to fix the primary issue of nested <a> tags. */}
          {/* If a "Go to [title]" or similar CTA is desired, it can be a simple text or a styled div */}
          
        </CardFooter>
      </Card>
    </a>
  );
}
