import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from '@/assets/Logo.png';
import { supabase } from "../lib/supabase";
import { z } from "zod";
import { Eye, EyeOff, Headphones, HelpCircle, Loader2 } from "lucide-react";
import { AuthCarousel } from "@/components/AuthCarousel";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#121212] text-white">
      {/* Left Column: Visual Carousel (44% width) */}
      <div className="hidden lg:block w-[44%] shrink-0 h-screen sticky top-0">
        <AuthCarousel />
      </div>

      {/* Right Column: Clean, High-Fidelity Login Form (56% width) */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen flex-1">
        {/* Top Header / Branding */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={Logo} alt="Zibo" className="h-[26px] w-auto object-contain" />
          </Link>
          <div className="h-4 w-px bg-[#2E2E2E]" />
          <div className="text-[11px] text-[#71717A] leading-tight font-normal">
            <p>Know what works.</p>
            <p>Know why.</p>
          </div>
        </div>

        {/* Center Auth Form */}
        <div className="w-full max-w-[420px] mx-auto py-12">
          {/* Headline */}
          <div className="mb-8">
            <span className="text-[13px] text-[#8E8E93] block mb-1.5 font-normal tracking-wide">
              Login to
            </span>
            <h1 className="text-[34px] sm:text-[38px] font-serif font-normal text-white tracking-tight leading-[1.15]">
              Where Great Design Makes Sense.
            </h1>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="Enter e-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10.5 px-4 rounded-xl bg-[#1C1C1E] border border-white/10 text-white placeholder-[#71717A] text-[14px] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:bg-[#1C1C1E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1C1C1E_inset]"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10.5 pl-4 pr-11 rounded-xl bg-[#1C1C1E] border border-white/10 text-white placeholder-[#71717A] text-[14px] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:bg-[#1C1C1E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1C1C1E_inset]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot Password Row */}
            <div className="flex justify-end pt-0.5">
              <span className="text-[12.5px] text-[#8E8E93]">
                Forgot Password?{" "}
                <a href="#reset" onClick={(e) => { e.preventDefault(); alert("Please contact support or register your email to reset password."); }} className="text-white hover:underline underline-offset-4 font-medium">
                  Reset
                </a>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10.5 mt-3 rounded-full bg-white text-black font-semibold text-[14px] hover:bg-[#EBEBEB] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-black" /> : "Login"}
            </button>

            {/* Register Link */}
            <div className="text-center text-[13px] text-[#8E8E93] mt-5">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-white hover:underline underline-offset-4 font-medium">
                Register for Beta Testing
              </Link>
            </div>
          </form>
        </div>

        {/* Footer Links (Help & FAQs matching reference) */}
        <div className="flex items-center justify-center gap-6 text-[13px] text-[#71717A] pt-4">
          <button 
            type="button"
            onClick={() => window.location.href = "mailto:hello@zibo.co"}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <Headphones size={15} />
            <span>Help</span>
          </button>
          <Link to="/pricing" className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <HelpCircle size={15} />
            <span>FAQs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
