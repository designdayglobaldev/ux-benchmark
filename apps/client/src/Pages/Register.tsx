import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { z } from "zod";
import Logo from "@/assets/Logo.png";
import authImage from "../assets/auth.png";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      registerSchema.parse({ name, email, phone });
    } catch (err: any) {
      if (err && err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else {
        setError("Invalid input");
      }
      setLoading(false);
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/v1/auth/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to register");
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-10 w-auto object-contain" />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {success ? (
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">You're on the list!</h1>
                <p className="text-muted-foreground mb-6">
                  Thank you for registering for beta testing. We'll send you an email when your account is approved.
                </p>
                <Button onClick={() => navigate("/")} className="w-full bg-white text-black hover:bg-gray-200">
                  Return to Home
                </Button>
              </div>
            ) : (
              <form className="flex flex-col gap-6" onSubmit={handleRegister}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Register for beta testing</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Join the waitlist to get early access
                  </p>
                </div>
                <div className="grid gap-4">
                  {error && (
                    <div className="text-sm font-medium text-red-500 text-center">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="John Doe" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[#161616] border-[#333] text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#161616] border-[#333] text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-[#161616] border-[#333] text-white"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 mt-2" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="underline underline-offset-4 text-white hover:text-gray-300">
                    Log in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="relative hidden bg-[#0a0a0a] lg:block border-l border-[#222]">
        <img
          src={authImage}
          alt="Authentication"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
