import { Toaster as Sonner } from "sonner"
import type React from "react"; // Import React for ComponentProps

// Remove ToasterProps import and useTheme import
// type ToasterProps = React.ComponentProps<typeof Sonner> // Derive props type

const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  // Remove theme logic
  // const { theme = "system" } = useTheme()

  return (
    <Sonner
      // theme={theme as React.ComponentProps<typeof Sonner>["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group toast group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive group-[.toaster]:shadow-lg',
          success: 'group toast group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-600 group-[.toaster]:shadow-lg', // Example success styling
          warning: 'group toast group-[.toaster]:bg-yellow-500 group-[.toaster]:text-white group-[.toaster]:border-yellow-500 group-[.toaster]:shadow-lg', // Example warning styling
          info: 'group toast group-[.toaster]:bg-blue-500 group-[.toaster]:text-white group-[.toaster]:border-blue-500 group-[.toaster]:shadow-lg', // Example info styling

        }
      }}
      // Remove inline style, rely on Tailwind classes or global CSS variables for theming
      // style={{
      //   "--normal-bg": "var(--popover)",
      //   "--normal-text": "var(--popover-foreground)",
      //   "--normal-border": "var(--border)",
      // } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
