import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-orbitron font-bold text-lg">
              Red<span className="text-primary">Shield</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">API Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          {/* Status */}
          <div id="status" className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-muted-foreground">All Systems Operational</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 RedShield. Protecting the  RedM Community.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            RedShield is dedicated to preventing cheating and abuse. We do not promote, sell, or distribute cheats.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
