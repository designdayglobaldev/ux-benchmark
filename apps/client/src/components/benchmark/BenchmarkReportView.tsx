import { Loader2 } from 'lucide-react';
import { Sandpack } from "@codesandbox/sandpack-react";

export interface BenchmarkReportData {
  industry?: string;
  flow?: string;
  screenType?: string;
  summary?: string;
  overallAlignment?: string;
  snapshot?: {
    strongConventions?: string[];
    notableDifferences?: string[];
    keyOpportunities?: string[];
  };
  score?: number;
  marketAlignmentScore?: number;
  patternMaturityScore?: number;
  commonPatterns?: Array<{
    title: string;
    evidence: string;
    confidence: string;
    whyItMatters: string;
    exceptions?: string;
    benchmarkExamples?: string[];
    metrics?: any;
  }>;
  designDifferences?: Array<{
    title: string;
    yourDesign: string;
    benchmark: string;
    difference: string;
    potentialImpact: string;
  }>;
  opportunities?: Array<{
    title: string;
    observation: string;
    recommendation: string;
    evidence: string;
    confidence: string;
    exceptions?: string;
    benchmarkExamples?: string[];
  }>;
}

interface BenchmarkReportViewProps {
  benchmarkData: BenchmarkReportData;
  categoryTitle: string;
  flowTitle: string;
  subCategoryTitle: string;
  benchmarkScreens: any[];
  isGeneratingDesign: boolean;
  improvedDesignCode: string | null;
}

const getConfidencePill = (conf: string) => {
  if (!conf) return null;
  const isHigh = conf.toLowerCase().includes('high');
  const isMed = conf.toLowerCase().includes('medium');
  const isLow = conf.toLowerCase().includes('low');
  let bg = 'bg-[#333]';
  let text = 'text-[#ccc]';
  if (isHigh) { bg = 'bg-green-500/20'; text = 'text-green-400'; }
  else if (isMed) { bg = 'bg-yellow-500/20'; text = 'text-yellow-400'; }
  else if (isLow) { bg = 'bg-red-500/20'; text = 'text-red-400'; }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[13px] font-medium ${bg} ${text}`}>
      {conf}
    </span>
  );
};

export function BenchmarkReportView({
  benchmarkData,
  categoryTitle,
  flowTitle,
  subCategoryTitle,
  benchmarkScreens,
  isGeneratingDesign,
  improvedDesignCode,
}: BenchmarkReportViewProps) {
  return (
    <>
      {/* Metadata */}
      <div className="flex flex-col gap-3.5 mb-10">
        <div className="flex gap-2 text-[14px]">
          <span className="text-[#888]">Industry :</span>
          <span className="text-[#ccc]">{categoryTitle || 'Banking'}</span>
        </div>
        <div className="flex gap-2 text-[14px]">
          <span className="text-[#888]">Flow :</span>
          <span className="text-[#ccc]">{flowTitle || 'Onboarding'}</span>
        </div>
        <div className="flex gap-2 text-[14px]">
          <span className="text-[#888]">Subcategory :</span>
          <span className="text-[#ccc]">{subCategoryTitle || ''}</span>
        </div>
        <div className="flex gap-2 text-[14px]">
          <span className="text-[#888]">Benchmark group:</span>
          <span className="text-[#ccc]">Global {categoryTitle || ''}</span>
        </div>
        {benchmarkScreens && benchmarkScreens.length > 0 && (
          <div className="flex items-center gap-3 text-[14px] mt-2">
            <span className="text-[#888]">Comparable Products :</span>
            <div className="flex items-center gap-2">
              {benchmarkScreens.map((prod) => (
                <span key={prod.name} className="px-3 py-1 rounded-full bg-[#2a2a2a] text-[#ccc] text-[12px] font-medium">
                  {prod.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overall Alignment */}
      {benchmarkData.overallAlignment && (
        <div className="bg-[#1c1c1c] rounded-xl p-6 mb-12">
          <p className="text-[#666] text-[12px] mb-2 font-medium">Overall Benchmark Alignment</p>
          <p className="text-[#ddd] text-[14px] leading-relaxed">
            {benchmarkData.overallAlignment}
          </p>
        </div>
      )}

      {/* 1. Benchmark Snapshot */}
      {benchmarkData.snapshot && (
        <>
          <h2 className="text-[16px] font-semibold text-white mb-6">1. Benchmark Snapshot</h2>
          <div className="grid grid-cols-3 gap-5 mb-14">
            {/* Strong Conventions */}
            <div className="bg-[#1c1c1c] rounded-xl p-6">
              <h3 className="text-[#888] text-[13px] font-medium mb-4">Strong Conventions :</h3>
              <ul className="space-y-4">
                {(Array.isArray(benchmarkData.snapshot?.strongConventions) ? benchmarkData.snapshot.strongConventions : []).map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] text-[#ccc] leading-snug">
                    <span className="text-[#666] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Notable Differences */}
            <div className="bg-[#1c1c1c] rounded-xl p-6">
              <h3 className="text-[#888] text-[13px] font-medium mb-4">Notable Differences :</h3>
              <ul className="space-y-4">
                {(Array.isArray(benchmarkData.snapshot?.notableDifferences) ? benchmarkData.snapshot.notableDifferences : []).map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] text-[#ccc] leading-snug">
                    <span className="text-[#666] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Key Opportunities */}
            <div className="bg-[#1c1c1c] rounded-xl p-6">
              <h3 className="text-[#888] text-[13px] font-medium mb-4">Key Opportunities</h3>
              <ul className="space-y-4">
                {(Array.isArray(benchmarkData.snapshot?.keyOpportunities) ? benchmarkData.snapshot.keyOpportunities : []).map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] text-[#ccc] leading-snug">
                    <span className="text-[#666] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* 2. Common Benchmark Patterns */}
      <h2 className="text-[16px] font-semibold text-white mb-6">2. Common Benchmark Patterns</h2>
      <div className="space-y-10 mb-14">
        {(Array.isArray(benchmarkData.commonPatterns) ? benchmarkData.commonPatterns : []).map((pattern, i) => (
          <div key={i} className="flex flex-col gap-4 border-t border-[#2a2a2a] pt-6">
            <div>
              <h3 className="text-white text-[15px] font-medium mb-1">{pattern.title}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[#666] text-[12px] mb-1">Benchmark Evidence</p>
                <p className="text-[#ccc] text-[13px]">{pattern.evidence}</p>
              </div>
              <div>
                <p className="text-[#666] text-[12px] mb-1">Confidence</p>
                <div>{getConfidencePill(pattern.confidence)}</div>
              </div>
            </div>
            
            <div>
              <p className="text-[#666] text-[12px] mb-1">Why it matters</p>
              <p className="text-[#ccc] text-[13px]">{pattern.whyItMatters}</p>
            </div>

            {pattern.exceptions && (
              <div>
                <p className="text-[#666] text-[12px] mb-1">Exceptions</p>
                <p className="text-[#ccc] text-[13px]">{pattern.exceptions}</p>
              </div>
            )}

            {pattern.benchmarkExamples && pattern.benchmarkExamples.length > 0 && (
              <div>
                <p className="text-[#666] text-[12px] mb-1">Benchmark examples</p>
                <ul className="list-disc list-inside text-[#ccc] text-[13px] space-y-1">
                  {pattern.benchmarkExamples.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {pattern.metrics && (
              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <p className="text-[#666] text-[12px] mb-1">Market Standard Parity ({pattern.metrics.marketStandardParity?.score ?? pattern.metrics.marketStandardParity}/10)</p>
                  {pattern.metrics.marketStandardParity?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.marketStandardParity.reasoning}</p>}
                </div>
                <div>
                  <p className="text-[#666] text-[12px] mb-1">Proven Pattern Adherence ({pattern.metrics.provenPatternAdherence?.score ?? pattern.metrics.provenPatternAdherence}/10)</p>
                  {pattern.metrics.provenPatternAdherence?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.provenPatternAdherence.reasoning}</p>}
                </div>
                <div>
                  <p className="text-[#666] text-[12px] mb-1">Information Density Match ({pattern.metrics.informationDensityMatch?.score ?? pattern.metrics.informationDensityMatch}/10)</p>
                  {pattern.metrics.informationDensityMatch?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.informationDensityMatch.reasoning}</p>}
                </div>
                <div>
                  <p className="text-[#666] text-[12px] mb-1">Competitive Edge ({pattern.metrics.competitiveEdge?.score ?? pattern.metrics.competitiveEdge}/10)</p>
                  {pattern.metrics.competitiveEdge?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.competitiveEdge.reasoning}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Where Your Design Differs */}
      <h2 className="text-[16px] font-semibold text-white mb-6">3. Where Your Design Differs</h2>
      <div className="space-y-10 mb-14">
        {(Array.isArray(benchmarkData.designDifferences) ? benchmarkData.designDifferences : []).map((diff, i) => (
          <div key={i} className="flex flex-col gap-4 border-t border-[#2a2a2a] pt-6">
            <h3 className="text-white text-[15px] font-medium">{diff.title}</h3>
            
            <div>
              <p className="text-[#666] text-[12px] mb-1">Your design</p>
              <p className="text-[#ccc] text-[13px]">{diff.yourDesign}</p>
            </div>
            
            <div>
              <p className="text-[#666] text-[12px] mb-1">Benchmark</p>
              <p className="text-[#ccc] text-[13px]">{diff.benchmark}</p>
            </div>

            <div>
              <p className="text-[#666] text-[12px] mb-1">Difference</p>
              <p className="text-[#ccc] text-[13px]">{diff.difference}</p>
            </div>

            <div>
              <p className="text-[#666] text-[12px] mb-1">Potential impact</p>
              <p className="text-[#ccc] text-[13px]">{diff.potentialImpact}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Key Opportunities */}
      <h2 className="text-[16px] font-semibold text-white mb-6">4. Key Opportunities</h2>
      <div className="space-y-10 pb-10 border-t border-[#2a2a2a] pt-6">
        {(Array.isArray(benchmarkData.opportunities) ? benchmarkData.opportunities : []).map((opp, i) => (
          <div key={i} className="flex flex-col gap-4 mt-6 first:mt-0">
            <h3 className="text-white text-[15px] font-medium">{opp.title}</h3>
            
            <div>
              <p className="text-[#666] text-[12px] mb-1">Observation</p>
              <p className="text-[#ccc] text-[13px]">{opp.observation}</p>
            </div>
            
            <div>
              <p className="text-[#666] text-[12px] mb-1">Recommendation</p>
              <p className="text-[#ccc] text-[13px]">{opp.recommendation}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[#666] text-[12px] mb-1">Benchmark Evidence</p>
                <p className="text-[#ccc] text-[13px]">{opp.evidence}</p>
              </div>
              <div>
                <p className="text-[#666] text-[12px] mb-1">Confidence</p>
                <div>{getConfidencePill(opp.confidence)}</div>
              </div>
            </div>

            {opp.exceptions && (
              <div>
                <p className="text-[#666] text-[12px] mb-1">Exceptions</p>
                <p className="text-[#ccc] text-[13px]">{opp.exceptions}</p>
              </div>
            )}

            {opp.benchmarkExamples && opp.benchmarkExamples.length > 0 && (
              <div>
                <p className="text-[#666] text-[12px] mb-1">Benchmark examples</p>
                <ul className="list-disc list-inside text-[#ccc] text-[13px] space-y-1">
                  {opp.benchmarkExamples.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 5. Improved UI Generated by AI */}
      {(isGeneratingDesign || improvedDesignCode) && (
        <>
          <h2 className="text-[16px] font-semibold text-white mb-6 mt-10">5. Improved UI Recommendation</h2>
          <div className="border-t border-[#2a2a2a] pt-6 pb-10">
            {isGeneratingDesign ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[#1a1a1a] rounded-2xl border border-[#333]">
                <Loader2 className="w-8 h-8 text-[#4E6BFF] animate-spin mb-4" />
                <p className="text-white text-[15px] font-medium">✨ AI is crafting an improved interactive design based on these findings...</p>
                <p className="text-[#888] text-[13px] mt-2">Generating live HTML + Tailwind code</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-[#333]">
                <Sandpack 
                  template="static"
                  theme="dark"
                  files={{
                    "/index.html": improvedDesignCode || "",
                    "/styles.css": ""
                  }}
                  options={{
                    showNavigator: true,
                    showLineNumbers: true,
                    editorHeight: "600px",
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
