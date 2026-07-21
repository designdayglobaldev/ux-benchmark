import { Button } from "./components/ui/button"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans flex flex-col items-center">
      
      {/* Background Glow Effect - Adjusted for visibility */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/15 blur-[100px] rounded-[100%] pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 w-full max-w-7xl z-50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-xl leading-none tracking-tight text-white">BenchmarX</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">by Designday</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#" className="text-white hover:text-white transition-colors">Benchmark Library</a>
          <a href="#" className="hover:text-white transition-colors">UX ROI Calculator</a>
          <a href="#" className="hover:text-white transition-colors">AI Design System</a>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="text-gray-300 hover:text-white transition-colors hidden sm:block">About</a>
          <Button variant="outline" className="rounded-xl border-border/60 hover:bg-white/5 transition-all text-white bg-transparent h-9 px-4 text-xs font-medium">
            <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            Book a Demo
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center pt-20 pb-16 px-4 text-center w-full max-w-5xl">
        
        {/* Badge */}
        <div className="mb-8 rounded-full border border-border/30 bg-[#1a1a1a]/80 px-3 py-1 text-[11px] font-medium text-gray-400 backdrop-blur-sm shadow-sm">
          Updated weekly
        </div>

        {/* Main Heading */}
        <h1 className="max-w-[900px] text-[40px] md:text-[56px] lg:text-[72px] font-semibold tracking-[-0.02em] leading-[1.05] mb-12 text-white">
          Evidence-backed UX benchmarking for apps & sites
        </h1>

        {/* Subscribe Input */}
        <div className="flex w-full max-w-[500px] items-center space-x-2 bg-[#1a1a1a]/80 border border-border/30 rounded-full p-1.5 shadow-inner mb-6 transition-all focus-within:ring-1 focus-within:ring-gray-600">
          <input 
            type="email" 
            placeholder="hi@example.com" 
            className="flex-1 bg-transparent px-5 text-[15px] outline-none placeholder:text-gray-500 text-white"
          />
          <Button type="submit" className="rounded-full px-6 bg-[#2a2a2a] hover:bg-[#333333] text-gray-200 text-sm font-medium h-9 border border-border/20">
            Subscribe
          </Button>
        </div>
        
        <p className="text-[13px] text-gray-400 mb-16 font-medium">
          Stay ahead with weekly UX benchmark updates.
        </p>

        {/* Categories Bar */}
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground w-full max-w-5xl mb-8">
          <a href="#" className="text-white bg-secondary/80 px-4 py-1.5 rounded-full">Latest</a>
          <a href="#" className="px-4 py-1.5 hover:text-white transition-colors">Productivity</a>
          <a href="#" className="px-4 py-1.5 hover:text-white transition-colors">Lifestyle</a>
          <a href="#" className="px-4 py-1.5 hover:text-white transition-colors">Technology</a>
          <a href="#" className="px-4 py-1.5 hover:text-white transition-colors">Entertainment</a>
          <a href="#" className="px-4 py-1.5 hover:text-white transition-colors">Finance & Banking</a>
        </div>

      </main>
    </div>
  )
}

export default App
