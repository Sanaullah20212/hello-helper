import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, UserPlus } from "lucide-react";

const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, isAdmin, adminChecked, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AdminAuth state:", { user: user?.email, isAdmin, adminChecked, loading });
    if (!loading && adminChecked && user && isAdmin) {
      console.log("Redirecting to admin panel");
      navigate("/admin");
    }
  }, [user, isAdmin, adminChecked, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Please contact admin for access.");
      }
      setIsLoading(false);
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      } else {
        toast.success("Login successful!");
        // Let the useEffect handle the redirect after admin check completes
      }
    }
  };

  // Reset loading when admin check completes
  useEffect(() => {
    if (adminChecked && isLoading) {
      setIsLoading(false);
    }
  }, [adminChecked, isLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isSignUp ? "Create Account" : "Admin Login"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp 
                ? "Sign up to request admin access" 
                : "Enter your credentials to access the admin panel"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
              {isSignUp ? <UserPlus className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>

          {user && adminChecked && !isAdmin && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
              <p className="text-sm text-destructive">You don't have admin access. Please contact the administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
