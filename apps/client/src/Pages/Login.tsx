import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../lib/supabase";

import { z } from "zod";
import authImage from "../assets/auth.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      loginSchema.parse({ email, password });
    } catch (err: any) {
      if (err && err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else {
        setError("Invalid input");
      }
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#132A60] via-[#2453B2] to-[#4084F4] shadow-inner overflow-hidden relative">
              <div className="absolute bottom-0 w-full h-[55%] bg-white rounded-t-[40%] flex items-start justify-center">
                <div className="w-2 h-2 bg-black rounded-full mt-1 opacity-0"></div>
              </div>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white absolute top-[25%] z-10" fill="currentColor">
                <path d="M12 2C12 2 12 10 20 10C12 10 12 18 12 18C12 18 12 10 4 10C12 10 12 2 12 2Z" />
              </svg>
            </div>
            <span className="text-[22px] font-light tracking-wide text-[#EAEAEA] leading-none">Benchmar<span className="font-normal">X</span></span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form className="flex flex-col gap-6" onSubmit={handleLogin}>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Enter your email below to login to your account
                </p>
              </div>
              <div className="grid gap-6">
                {error && (
                  <div className="text-sm font-medium text-red-500 text-center">
                    {error}
                  </div>
                )}
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
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#161616] border-[#333] text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                
                {/* Hidden for now */}
                <div className="hidden">
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-[#333]">
                    <span className="relative z-10 bg-black px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                  <Button variant="outline" className="w-full bg-[#161616] border-[#333] text-white hover:bg-[#222] mt-6">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                      <path
                        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                        fill="currentColor"
                      />
                    </svg>
                    Login with GitHub
                  </Button>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="underline underline-offset-4 text-white hover:text-gray-300">
                  Register for beta testing
                </Link>
              </div>
            </form>
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
