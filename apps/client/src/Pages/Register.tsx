import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "@/assets/Logo.png";
import { z } from "zod";
import { Headphones, HelpCircle, Loader2, Mail, AlertCircle } from "lucide-react";
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
  const [_registrationData, setRegistrationData] = useState<any>(null);

  const maskEmail = (str: string) => {
    if (!str || !str.includes('@')) return str;
    const [local, domain] = str.split('@');
    if (local.length <= 3) return `${local[0]}*@${domain}`;
    return `${local.slice(0, 3)}*@${domain}`;
  };

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
    <div className="flex min-h-screen w-full bg-[#121212] text-white">
      {/* Left Column: Visual Carousel (44% width) */}
      <div className="hidden lg:block w-[44%] shrink-0 h-screen sticky top-0">
        <AuthCarousel />
      </div>

      {/* Right Column: Clean, High-Fidelity Register Form (56% width) */}
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

        {/* Center Register Form / Success View */}
        <div className="w-full max-w-[473px] mx-auto py-8">
          {success ? (
            /* Frame 2147228018 */
            <div className="flex flex-col items-start gap-[36px] w-full text-left">
              {/* Frame 2147231079 (Header + Steps + Alert) */}
              <div className="flex flex-col items-start gap-[38px] w-full">
                {/* Frame 2147231076: Title & Description */}
                <div className="flex flex-col items-start gap-[4px] w-full">
                  <h1 className="font-serif font-normal text-[38px] leading-[49px] text-white">
                    Check Your Email
                  </h1>
                  <p className="font-sans font-normal text-[16px] leading-[145%] text-[#B9B9BE]">
                    Your registration is successful! We've sent your temporary login credentials to your registered email address.
                  </p>
                </div>

                {/* Frame 2147231080: Next Steps Section */}
                <div className="flex flex-col items-start w-full gap-[20px]">
                  {/* Title */}
                  <span className="font-sans font-normal text-[16px] leading-[19px] tracking-[0.12em] uppercase text-[#B9B9BE]">
                    NEXT STEPS
                  </span>

                  {/* Ordered list */}
                  <div className="flex flex-col items-start gap-[40px] w-full relative">
                    {/* Item 1 */}
                    <div className="flex flex-row items-start gap-[16px] w-full relative isolate">
                      {/* Vertical connector line between step 1 and step 2 */}
                      <div 
                        className="absolute w-[1px] bg-[#2E2E33] pointer-events-none z-0" 
                        style={{
                          left: "13.5px",
                          top: "28px",
                          height: "115px",
                        }}
                      />

                      {/* Step 1 marker */}
                      <div className="pt-1 shrink-0 z-10">
                        <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center bg-gradient-to-b from-[#F68E1D] to-[#F4336F] shadow-sm">
                          <span className="font-sans font-semibold text-[14px] leading-[17px] text-white">
                            1
                          </span>
                        </div>
                      </div>

                      {/* Step 1 Instructions */}
                      <div className="flex flex-col items-start gap-[12px] flex-1 z-10">
                        <div className="flex flex-col items-start gap-[4px] w-full">
                          <h3 className="font-sans font-medium text-[18px] leading-[22px] text-white">
                            Check your email
                          </h3>
                          <p className="font-sans font-normal text-[14px] leading-[145%] text-[#B9B9BE]">
                            We've sent your login credentials. Please check your inbox or spam folder.
                          </p>
                        </div>

                        {/* Email display pill */}
                        <div className="flex flex-row items-center gap-[8px] text-[#B9B9BE]">
                          <Mail size={16} className="text-[#B9B9BE]" />
                          <span className="font-sans font-medium text-[15px] leading-[145%] text-[#B9B9BE]">
                            {maskEmail(email)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex flex-row items-start gap-[16px] w-full relative isolate">
                      {/* Step 2 marker */}
                      <div className="pt-1 shrink-0 z-10">
                        <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[#181818] border border-[#4A4A50]">
                          <span className="font-sans font-semibold text-[14px] leading-[17px] text-white">
                            2
                          </span>
                        </div>
                      </div>

                      {/* Step 2 Instructions */}
                      <div className="flex flex-col items-start gap-[4px] flex-1 z-10">
                        <h3 className="font-sans font-medium text-[18px] leading-[22px] text-white">
                          Log in to your account
                        </h3>
                        <p className="font-sans font-normal text-[14px] leading-[145%] text-[#B9B9BE]">
                          Use your registered email and temporary password to access Zibo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Red Security Alert Notification */}
                <div 
                  role="alert" 
                  className="flex flex-row items-start p-4 gap-[12px] w-full bg-[#3A1518] border border-[#E5484D] rounded-[12px] shadow-[0px_8px_24px_rgba(0,0,0,0.4)]"
                >
                  <AlertCircle size={20} className="text-[#FF6B6F] shrink-0 mt-0.5" />
                  <p className="font-sans font-medium text-[14px] leading-[145%] text-white">
                    You must have received a secure password, please check your email inbox and also your spam folder.
                  </p>
                </div>
              </div>

              {/* Action Button: Go to Login */}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full h-[48px] rounded-full bg-white text-[#1A1A1A] font-sans font-medium text-[14px] leading-[17px] hover:bg-[#EBEBEB] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer shadow-sm"
              >
                Go to Login
              </button>
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
            onClick={() => window.location.href = "mailto:heyz@zibo.design"}
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
