/**
 * Unified Brand Configuration
 * Centralizes all logo paths, colors, and brand assets for easier maintenance
 */

// Logo imports - use ES6 imports for bundling optimization
import logoIconDark from "@/assets/logo-icon-dark.png";
import logoIconLight from "@/assets/logo-icon-light.png";
import logoDark from "@/assets/predifi-logo-dark.png";
import logoLight from "@/assets/predifi-logo-light.png";

export const brand = {
  name: "Predifi",
  tagline: "Next-Gen Decentralized Prediction Markets",
  description: "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage. Built for champions.",
  
  // Website URLs
  urls: {
    website: "https://predifi.com",
    docs: "https://docs.predifi.com",
    twitter: "https://twitter.com/predifi",
    discord: "https://discord.gg/predifi",
    telegram: "https://t.me/predifi",
  },
  
  // Logo assets - full logo with text
  logo: {
    dark: logoDark,    // White logo for dark backgrounds
    light: logoLight,  // Black logo for light backgrounds
  },
  
  // Icon assets - just the symbol
  icon: {
    dark: logoIconDark,   // White icon for dark backgrounds  
    light: logoIconLight, // Black icon for light backgrounds
  },
  
  // Public paths for use in meta tags, CSS, etc.
  publicPaths: {
    favicon: "/favicon.png",
    ogImage: "/og-image.png",
    manifest: "/manifest.json",
  },
  
  // Brand colors (matching CSS variables from index.css)
  colors: {
    primary: "hsl(192, 100%, 50%)",      // Cyan accent
    primaryForeground: "hsl(0, 0%, 0%)",
    secondary: "hsl(240, 4%, 16%)",
    accent: "hsl(192, 100%, 50%)",
    success: "hsl(142, 71%, 45%)",       // Green for YES
    destructive: "hsl(0, 84%, 60%)",     // Red for NO
    warning: "hsl(45, 93%, 47%)",        // Yellow/Gold
  },
  
  // SEO defaults
  seo: {
    defaultTitle: "Predifi - Next-Gen Decentralized Prediction Markets",
    defaultDescription: "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage. Built for champions.",
    defaultImage: "/og-image.png",
    twitterHandle: "@predifi",
  },
  
  // Venue configuration for Predifi native markets
  venue: {
    id: "PREDIFI_NATIVE",
    displayName: "Predifi",
  },
} as const;

// Helper function to get theme-aware logo
export function getThemedLogo(theme: string | undefined, resolvedTheme?: string) {
  const effectiveTheme = theme === "system" ? (resolvedTheme || "light") : (theme || "light");
  return effectiveTheme === "dark" ? brand.logo.dark : brand.logo.light;
}

// Helper function to get theme-aware icon
export function getThemedIcon(theme: string | undefined, resolvedTheme?: string) {
  const effectiveTheme = theme === "system" ? (resolvedTheme || "light") : (theme || "light");
  return effectiveTheme === "dark" ? brand.icon.dark : brand.icon.light;
}

// Export individual logo imports for direct use
export { logoIconDark, logoIconLight, logoDark, logoLight };
