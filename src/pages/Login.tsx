import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UtensilsCrossed, Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRedirectPath = async (userId: string): Promise<string> => {
    // Check roles in order of priority
    const roles = ["admin", "kitchen", "cashier"] as const;

    for (const role of roles) {
      const { data } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: role,
      });

      if (data) {
        switch (role) {
          case "admin":
            return "/admin";
          case "kitchen":
            return "/kitchen";
          case "cashier":
            return "/cashier";
        }
      }
    }

    return "/dashboard"; // Default for customers
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login Gagal",
        description:
          error.message === "Invalid login credentials"
            ? "Email atau password salah"
            : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Get current user to check roles
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const redirectPath = await getRedirectPath(user.id);
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      });
      navigate(redirectPath);
    } else {
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-primary mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Dapoer-Attauhid
          </h1>
          <p className="text-muted-foreground mt-2">
            Pesan makanan untuk anak Anda dengan mudah
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Masuk</CardTitle>
            <CardDescription className="text-center">
              Masuk ke akun Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
