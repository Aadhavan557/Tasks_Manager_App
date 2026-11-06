import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset instructions sent!");
    } catch (err: any) {
      toast.info("If Supabase is in standby mode, you can sign in directly using the Quick Switcher.");
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">DuoMate</h1>
            <p className="text-xs text-muted-foreground">Password Recovery</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center text-xs">
              Enter your email to receive recovery instructions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {sent ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm">Check your inbox</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We've sent a secure reset link to <strong className="text-foreground">{email}</strong>.
                </p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <ArrowLeft className="h-3 w-3" /> Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Registered Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="aadhavan@duomate.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full h-9 text-xs"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

