import { useState } from "react";
import { Shield, Menu, X, LogOut, User, Key, Clock, AlertTriangle } from "lucide-react";
import { formatTimeRemaining } from "@/lib/timeUtils";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogin, useLogout } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Tools", href: "#tools" },
  { label: "Partners", href: "#partners" },
  { label: "Status", href: "#status" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: user, isLoading } = useCurrentUser();
  const login = useLogin();
  const logoutMutation = useLogout();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-primary icon-glow transition-all duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-orbitron font-bold text-xl tracking-wide">
              Red<span className="text-primary">Shield</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="nav-link text-sm font-medium">
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse bg-muted rounded-md" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isOwner ? "default" : user.isContributor ? "secondary" : "outline"} className="text-xs">
                          {user.isOwner ? "Owner" : user.isContributor ? "Contributor" : "Member"}
                        </Badge>
                        {user.license?.is_active && user.license.expires_at && (
                          <span className="text-xs text-green-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeRemaining(user.license.expires_at)} left
                          </span>
                        )}
                      </div>
                      {user.license && !user.license.is_active && user.license.status === 'EXPIRED' && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          License expired
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(user.isContributor || user.isOwner) && (
                    <DropdownMenuItem asChild>
                      <a href="/dashboard">Dashboard</a>
                    </DropdownMenuItem>
                  )}
                  {/* Show Claim License for non-contributors or expired licenses */}
                  {!user.isOwner && (!user.isContributor || (user.license && !user.license.is_active)) && (
                    <DropdownMenuItem asChild>
                      <a href="/claim-license" className="flex items-center">
                        <Key className="mr-2 h-4 w-4 text-primary" />
                        Claim License
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={login}
                className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Login with Discord
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {isLoading ? (
                <div className="h-10 animate-pulse bg-muted rounded-md" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isOwner ? "default" : user.isContributor ? "secondary" : "outline"} className="text-xs">
                          {user.isOwner ? "Owner" : user.isContributor ? "Contributor" : "Member"}
                        </Badge>
                        {user.license?.is_active && user.license.expires_at && (
                          <span className="text-xs text-green-500">{formatTimeRemaining(user.license.expires_at)} left</span>
                        )}
                      </div>
                      {user.license && !user.license.is_active && user.license.status === 'EXPIRED' && (
                        <p className="text-xs text-destructive mt-1">License expired</p>
                      )}
                    </div>
                  </div>
                  {(user.isContributor || user.isOwner) && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <a href="/dashboard">Dashboard</a>
                    </Button>
                  )}
                  {!user.isOwner && (!user.isContributor || (user.license && !user.license.is_active)) && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <a href="/claim-license">
                        <Key className="mr-2 h-4 w-4 text-primary" />
                        Claim License
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={login}
                  className="btn-glow bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Login with Discord
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
