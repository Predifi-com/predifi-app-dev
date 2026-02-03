import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Mail, Sparkles, Check, ArrowRight, ArrowLeft, Loader2, Shield, Share2, Copy, Users, Trophy, Home } from "lucide-react";
import { useWaitlistGate } from "@/hooks/useWaitlistGate";
import { useWallet } from "@/hooks/useWallet";
import { WalletButton } from "@/components/WalletButton";
import { toast } from "sonner";
import { useTheme } from "@/providers/ThemeProvider";
import { getThemedLogo } from "@/config/brand";

interface WaitlistGateProps {
  children: React.ReactNode;
}

export function WaitlistGate({ children }: WaitlistGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const { theme, resolvedTheme } = useTheme();
  const logo = getThemedLogo(theme, resolvedTheme);
  
  const { 
    isWhitelisted, 
    isLoading, 
    isOnWaitlist, 
    joinWaitlist, 
    checkWhitelistStatus,
    waitlistEntry,
    queuePosition,
    getShareUrl 
  } = useWaitlistGate();
  const { address, isConnected } = useWallet();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Advanced GSAP animations
  useEffect(() => {
    if (!containerRef.current || isLoading || isWhitelisted) return;

    const ctx = gsap.context(() => {
      // Animated grid lines
      gsap.to(".grid-line-h", {
        scaleX: 1,
        opacity: 0.08,
        duration: 1.5,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.to(".grid-line-v", {
        scaleY: 1,
        opacity: 0.08,
        duration: 1.5,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.3,
      });

      // Floating orbs animation
      gsap.utils.toArray(".floating-orb").forEach((orb: any, i) => {
        const duration = 4 + Math.random() * 4;
        const delay = i * 0.5;
        
        gsap.to(orb, {
          y: "random(-60, 60)",
          x: "random(-40, 40)",
          scale: "random(0.8, 1.2)",
          duration: duration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: delay,
        });

        gsap.to(orb, {
          opacity: "random(0.15, 0.4)",
          duration: duration / 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: delay,
        });
      });

      // Pulsing glow effect
      gsap.to(".main-glow", {
        scale: 1.1,
        opacity: 0.6,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Scanning line animation
      gsap.to(".scan-line", {
        y: "100vh",
        duration: 4,
        repeat: -1,
        ease: "none",
      });

      // Particle field animation
      gsap.utils.toArray(".particle").forEach((particle: any, i) => {
        gsap.to(particle, {
          y: "random(-100, 100)",
          x: "random(-50, 50)",
          opacity: "random(0.1, 0.5)",
          duration: "random(3, 6)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.1,
        });
      });

      // Card entrance animation
      if (formRef.current) {
        gsap.fromTo(formRef.current,
          { 
            opacity: 0, 
            y: 60, 
            scale: 0.9,
            rotateX: 10,
          },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            rotateX: 0,
            duration: 1.2, 
            ease: "power4.out", 
            delay: 0.5 
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, isWhitelisted]);

  // Success celebration animation
  useEffect(() => {
    if (showSuccess && formRef.current) {
      gsap.timeline()
        .to(formRef.current, {
          scale: 1.02,
          boxShadow: "0 0 60px rgba(34, 197, 94, 0.3)",
          duration: 0.4,
          ease: "power2.out",
        })
        .to(formRef.current, {
          scale: 1,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          duration: 0.3,
          ease: "power2.inOut",
        });
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    const { success, error, alreadyExists } = await joinWaitlist(
      email, 
      address || undefined,
      referralCode || undefined
    );
    setIsSubmitting(false);

    if (success) {
      setShowSuccess(true);
      if (alreadyExists) {
        toast.info("You're already on the waitlist!");
      } else {
        toast.success("You're on the waitlist!", {
          description: referralCode 
            ? "Thanks for using a referral link!" 
            : "Share your link to move up the queue.",
        });
      }
    } else {
      toast.error(error || "Failed to join waitlist");
    }
  };

  const handleCopyReferralLink = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isConnected && address) {
      checkWhitelistStatus(address);
    }
  }, [isConnected, address, checkWhitelistStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </motion.div>
      </div>
    );
  }

  if (isWhitelisted) {
    return <>{children}</>;
  }

  // Generate grid lines
  const horizontalLines = Array.from({ length: 12 }, (_, i) => i);
  const verticalLines = Array.from({ length: 20 }, (_, i) => i);
  const particles = Array.from({ length: 30 }, (_, i) => i);
  const orbs = [
    { size: 300, color: "primary", x: "10%", y: "20%", blur: 120 },
    { size: 400, color: "accent", x: "80%", y: "60%", blur: 150 },
    { size: 200, color: "primary", x: "50%", y: "80%", blur: 100 },
    { size: 250, color: "accent", x: "20%", y: "70%", blur: 80 },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
      style={{ perspective: "1000px" }}
    >
      {/* Animated Grid Background */}
      <div ref={gridRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Horizontal grid lines */}
        {horizontalLines.map((i) => (
          <div
            key={`h-${i}`}
            className="grid-line-h absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0"
            style={{
              top: `${(i + 1) * (100 / 13)}%`,
              transform: "scaleX(0)",
              transformOrigin: "center",
            }}
          />
        ))}
        
        {/* Vertical grid lines */}
        {verticalLines.map((i) => (
          <div
            key={`v-${i}`}
            className="grid-line-v absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent opacity-0"
            style={{
              left: `${(i + 1) * (100 / 21)}%`,
              transform: "scaleY(0)",
              transformOrigin: "center",
            }}
          />
        ))}
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {orbs.map((orb, i) => (
          <div
            key={i}
            className="floating-orb absolute rounded-full opacity-20"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.x,
              top: orb.y,
              background: `radial-gradient(circle, hsl(var(--${orb.color})) 0%, transparent 70%)`,
              filter: `blur(${orb.blur}px)`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* Main Glow */}
      <div
        ref={glowRef}
        className="main-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Scanning Line Effect */}
      <div
        className="scan-line absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.5) 50%, transparent 100%)",
          boxShadow: "0 0 20px 5px hsl(var(--primary) / 0.3)",
          top: "-100px",
        }}
      />

      {/* Particle Field */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div ref={formRef} className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Predifi" className="h-10 opacity-90" />
        </div>

        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit border border-primary/20">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Early Access</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {referralCode 
                ? "You've been invited! Join the waitlist for priority access."
                : "Predifi is currently in private beta. Join the waitlist or connect your wallet to check access."}
            </CardDescription>
            {referralCode && (
              <Badge variant="secondary" className="mt-3 gap-1.5">
                <Users className="w-3 h-3" />
                Referred by a friend
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Wallet connection section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4" />
                <span>Connect wallet to check whitelist status</span>
              </div>
              <div className="w-full flex justify-center">
                <WalletButton />
              </div>
              {isConnected && address && (
                <div className="flex items-center gap-2 text-sm justify-center">
                  <Badge variant="outline" className="font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </Badge>
                  {!isWhitelisted && (
                    <span className="text-muted-foreground">Not yet whitelisted</span>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Success state with referral sharing */}
            {(showSuccess || isOnWaitlist) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="text-center py-4 space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">You're on the list!</h3>
                    {queuePosition && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Your position: <span className="font-bold text-foreground">#{queuePosition}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Referral stats */}
                {waitlistEntry && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-muted/50 text-center border border-border/50">
                      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold">
                        <Users className="w-5 h-5 text-primary" />
                        {waitlistEntry.referral_count}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Referrals</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 text-center border border-border/50">
                      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold">
                        <Trophy className="w-5 h-5 text-warning" />
                        +{waitlistEntry.priority_score}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Priority Points</p>
                    </div>
                  </div>
                )}

                {/* Share referral link */}
                {waitlistEntry?.referral_code && (
                  <div className="space-y-3">
                    <p className="text-sm text-center text-muted-foreground">
                      Share your link to move up the queue!
                    </p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={getShareUrl() || ""}
                        className="text-xs font-mono bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyReferralLink}
                        className="shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const shareUrl = getShareUrl();
                        if (shareUrl) {
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent("Join me on Predifi - the next-gen prediction markets platform! 🎯")}&url=${encodeURIComponent(shareUrl)}`,
                            "_blank"
                          );
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share on X
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>Join the waitlist with your email</span>
                  </div>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 gap-2 font-semibold"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Join Waitlist
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Back button */}
            <div className="pt-3 border-t border-border">
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              By joining, you agree to receive updates about Predifi.
              We respect your privacy and won't spam.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 Predifi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}