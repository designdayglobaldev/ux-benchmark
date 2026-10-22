import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "@/assets/Logo.png";
import { z } from "zod";
import { Headphones, HelpCircle, Loader2 } from "lucide-react";
import { AuthCarousel } from "@/components/AuthCarousel";

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
  const [registrationData, setRegistrationData] = useState<any>(null);

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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to register");
      }

      setRegistrationData(data);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2 bg-[#121212] text-white">
      {/* Left Column: Interactive Carousel */}
      <AuthCarousel />

      {/* Right Column: Clean, High-Fidelity Register Form */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen w-full">
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

        {/* Center Register Form */}
        <div className="w-full max-w-[420px] mx-auto py-12">
          {success ? (
            <div className="text-center py-8">
              <span className="text-[13px] text-[#8E8E93] block mb-2 font-normal tracking-wide">
                Confirmation
              </span>
              <h1 className="text-[34px] sm:text-[38px] font-serif font-normal text-white tracking-tight leading-[1.15] mb-4">
                {registrationData?.autoApproved ? "Access Granted!" : "You're on the list!"}
              </h1>
              <p className="text-[#A1A1AA] text-[15px] leading-relaxed mb-8">
                {registrationData?.autoApproved
                  ? "Your account has been automatically approved! We've sent temporary login credentials to your email."
                  : "Thank you for registering for beta testing. We'll send you an email when your account is approved."}
              </p>
              <div className="flex flex-col gap-3">
                {registrationData?.autoApproved ? (
                  <button 
                    onClick={() => navigate("/login")} 
                    className="w-full h-12 rounded-full bg-white text-black font-semibold text-[15px] hover:bg-[#EBEBEB] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate("/")} 
                    className="w-full h-12 rounded-full bg-white text-black font-semibold text-[15px] hover:bg-[#EBEBEB] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    Return to Home
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Headline */}
              <div className="mb-8">
                <span className="text-[13px] text-[#8E8E93] block mb-1.5 font-normal tracking-wide">
                  Join the platform
                </span>
                <h1 className="text-[34px] sm:text-[38px] font-serif font-normal text-white tracking-tight leading-[1.15]">
                  Register for Beta Testing.
                </h1>
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                {error && (
                  <div className="p-3 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Name Input */}
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    placeholder="Full name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10.5 px-4 rounded-xl bg-[#1C1C1E] border border-white/10 text-white placeholder-[#71717A] text-[14px] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:bg-[#1C1C1E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1C1C1E_inset]"
                  />
                </div>

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

                {/* Phone Input */}
                <div className="relative">
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Phone number (+1 555 000-0000)"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10.5 px-4 rounded-xl bg-[#1C1C1E] border border-white/10 text-white placeholder-[#71717A] text-[14px] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:bg-[#1C1C1E] [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_#1C1C1E_inset]"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10.5 mt-3 rounded-full bg-white text-black font-semibold text-[14px] hover:bg-[#EBEBEB] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin text-black" /> : "Request Beta Access"}
                </button>

                {/* Login Link */}
                <div className="text-center text-[13px] text-[#8E8E93] mt-5">
                  Already have an account?{" "}
                  <Link to="/login" className="text-white hover:underline underline-offset-4 font-medium">
                    Log in
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Links */}
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
