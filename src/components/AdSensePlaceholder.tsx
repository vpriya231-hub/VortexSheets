/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Sparkles, Code, Server, Flame } from 'lucide-react';

interface AdSensePlaceholderProps {
  position: 'top' | 'bottom';
  isDarkMode: boolean;
}

// Sleek high-end tech services ads that fit the spreadsheet workspace theme dynamically
const ADS_PRESETS = {
  top: {
    title: "VortexCloud® Database Cluster 4.0",
    description: "Scale your sheets real-time calculations directly to high-throughput Cloud Spanner instances instantly.",
    badge: "Enterprise Tech",
    cta: "Deploy Cluster",
    icon: <Server className="w-5 h-5 text-orange-500 animate-pulse" />
  },
  bottom: {
    title: "VortexFormula Masterclass™: From Cell to CEO",
    description: "Master multi-conditional SUMIFS, matrix formulas, dynamic lookups, and Python-in-Spreadsheet logic in 12 days.",
    badge: "Verified Skill",
    cta: "Learn Blueprint",
    icon: <Flame className="w-5 h-5 text-orange-500" />
  }
};

export default function AdSensePlaceholder({ position, isDarkMode }: AdSensePlaceholderProps) {
  const ad = ADS_PRESETS[position];

  return (
    <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:border-orange-500/35 overflow-hidden relative shadow-sm ${
      isDarkMode 
        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-900/80' 
        : 'bg-white border-orange-100 text-zinc-800 hover:bg-orange-50/10'
    }`}>
      {/* Background orange glow decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Ad Contents */}
      <div className="flex items-center gap-3.5 z-10 w-full md:w-auto">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isDarkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-orange-50 border border-orange-100'
        }`}>
          {ad.icon}
        </div>
        
        <div className="flex flex-col gap-0.5 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-100/60 dark:bg-orange-950/35 px-1.5 py-0.5 rounded">
              {ad.badge}
            </span>
            <span className="text-[10px] font-mono opacity-40">
              Sponsored Advertisement
            </span>
          </div>
          <h2 className="text-sm font-semibold tracking-tight">{ad.title}</h2>
          <p className="text-xs opacity-70 leading-relaxed max-w-2xl">{ad.description}</p>
        </div>
      </div>

      {/* Action CTA Button */}
      <a 
        href="#adsense-cta" 
        onClick={(e) => e.preventDefault()}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 shrink-0 transition-all ${
          isDarkMode 
            ? 'bg-zinc-800 border border-zinc-700 hover:border-orange-500/50 text-orange-400 hover:text-orange-300' 
            : 'bg-orange-50/80 border border-orange-100 text-orange-600 hover:bg-orange-100/70 hover:scale-105'
        }`}
      >
        <span>{ad.cta}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
