import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Rocket, Mail, Users, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const waitlistSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
  walletAddress: z.string().trim().max(100).optional(),
  referralCode: z.string().trim().max(50).optional(),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

export default function Waitlist() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
      walletAddress: "",
      referralCode: "",
    },
  });

  const onSubmit = async (values: WaitlistFormValues) => {
    setIsSubmitting(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("waitlist_signups")
        .select("id")
        .ilike("email", values.email)
        .maybeSingle();

      if (existing) {
        toast.error("This email is already on the waitlist!");
        setIsSubmitting(false);
        return;
      }

      // Generate a unique referral code for this user
      const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert into waitlist
      const { error } = await supabase.from("waitlist_signups").insert({
        email: values.email.toLowerCase().trim(),
        wallet_address: values.walletAddress?.trim() || null,
        referred_by: values.referralCode?.trim() || null,
        referral_code: referralCode,
        priority_score: values.referralCode ? 10 : 0, // Bonus for referred users
      });

      if (error) throw error;

      // Update referrer's count if referral code was used
      if (values.referralCode) {
        // Increment referral count for the referrer (silent, best-effort)
        try {
          await supabase
            .from("waitlist_signups")
            .update({ referral_count: 1 })
            .eq("referral_code", values.referralCode);
        } catch {
          // Silently fail
        }
      }

      // Get position in waitlist
      const { data: positionData } = await supabase
        .rpc("get_waitlist_position", { user_email: values.email.toLowerCase() });

      if (positionData) {
        setPosition(positionData as number);
      }

      // Try to send welcome email (optional)
      try {
        await supabase.functions.invoke("send-waitlist-welcome", {
          body: { email: values.email, referralCode },
        });
      } catch {
        // Email is optional, don't fail signup
      }

      setIsSuccess(true);
      toast.success("You're on the waitlist! 🎉");
    } catch (error: any) {
      console.error("Waitlist signup error:", error);
      toast.error(error.message || "Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <SEO 
          title="You're on the Waitlist | Predifi"
          description="Thank you for joining the Predifi waitlist. We'll notify you when it's your turn!"
        />
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl">You're In! 🎉</CardTitle>
                <CardDescription>
                  Welcome to the Predifi waitlist
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {position && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Your position</p>
                    <p className="text-4xl font-bold text-primary">#{position}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  We'll notify you via email when it's your turn to access Predifi.
                </p>
                <div className="pt-4">
                  <Button variant="outline" onClick={() => window.location.href = "/"}>
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Join the Waitlist | Predifi"
        description="Get early access to Predifi - the prediction market aggregator. Join our waitlist today!"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
              >
                <Rocket className="w-8 h-8 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Join the Waitlist
              </CardTitle>
              <CardDescription>
                Get early access to Predifi and be the first to trade on prediction markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="you@example.com" 
                            type="email"
                            autoComplete="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">
                          Wallet Address (optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0x..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Referral Code (optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="REF-XXXXXX" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Join Waitlist
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By joining, you agree to our{" "}
                <a href="/terms-of-service" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
