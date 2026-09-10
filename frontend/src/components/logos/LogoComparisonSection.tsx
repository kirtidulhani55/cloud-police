import React, { useState } from 'react';
import {
  ConceptALogo,
  ConceptBLogo,
  ConceptCLogo,
  LogoConceptId,
  LogoVariant,
} from './BrandLogoConcepts';
import { Check, Sparkles, Layers, Shield, Sliders, Eye } from 'lucide-react';

interface LogoComparisonSectionProps {
  activeConcept: LogoConceptId;
  onSelectConcept: (concept: LogoConceptId) => void;
  activeVariant: LogoVariant;
  onSelectVariant: (variant: LogoVariant) => void;
}

export const LogoComparisonSection: React.FC<LogoComparisonSectionProps> = ({
  activeConcept,
  onSelectConcept,
  activeVariant,
  onSelectVariant,
}) => {
  const [previewBg, setPreviewBg] = useState<'dark' | 'navy' | 'light'>('dark');
  const [selectedColor, setSelectedColor] = useState<string>('#E3A63E');

  const concepts = [
    {
      id: 'concept-a' as LogoConceptId,
      name: 'Concept A — Shield Negative Space',
      badge: 'Integrated Silhouette',
      description:
        'The bottom curve of the cloud is sculpted so the negative space between its two lower lobes forms an upward shield contour. One continuous, cohesive silhouette without combining two separate shapes.',
      component: ConceptALogo,
      keyTraits: [
        'Single cohesive cloud perimeter',
        'Subtle shield formed by bottom-center negative space',
        'Exceptional clarity at 24px and 16px',
        'No literal mascot or badges',
      ],
    },
    {
      id: 'concept-b' as LogoConceptId,
      name: 'Concept B — Checkpoint Cloud',
      badge: 'Boundary Gate Control',
      description:
        'A clean cloud silhouette with a single thin horizontal line / gate-bar across its lower third, symbolizing an infrastructure security checkpoint and strict human authorization boundary.',
      component: ConceptBLogo,
      keyTraits: [
        'Horizontal infrastructure barrier bar',
        'Evokes checkpoint & control gate',
        'Sharp technical precision line work',
        'Distinctive silhouette in dark & light',
      ],
    },
    {
      id: 'concept-c' as LogoConceptId,
      name: 'Concept C — Shield-Notch Cloud',
      badge: 'Subtle Crest Geometry',
      description:
        'A cloud silhouette with a small angular notch / chevron sculpted into the bottom-center base, imparting an integrated shield point at the foundation without adding any external badge element.',
      component: ConceptCLogo,
      keyTraits: [
        'Bottom-center chevron / shield-notch base',
        'Subtle security anchor point',
        'Reads instantly as cloud + security',
        'Balanced geometric symmetry',
      ],
    },
  ];

  const getBgClass = () => {
    switch (previewBg) {
      case 'navy':
        return 'bg-[#131826] border-[#242C40] text-[#E7EAF0]';
      case 'light':
        return 'bg-[#F6F3ED] border-[#E2DCD2] text-[#1B2233]';
      case 'dark':
      default:
        return 'bg-[#0B0E14] border-[#242C40] text-[#E7EAF0]';
    }
  };

  return (
    <section
      id="logo-redesign"
      className="py-20 bg-[#0E121E] border-b border-[#242C40] relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#E3A63E]/8 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131826] border border-[#242C40] text-xs font-mono text-[#D4A24E] font-semibold">
            <Shield className="w-3.5 h-3.5" />
            BRAND IDENTITY REDESIGN (CLOUD + SECURITY)
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Logo Redesign & Scalability Inspection
          </h2>
          <p className="text-base text-[#8B93A8]">
            Three refined concepts engineered for high-trust security infrastructure. Each mark is built from a single cloud silhouette with zero mascot cliches, comparing large 200px displays against crisp 24px micro-sizes.
          </p>

          {/* Interactive Controls Bar: Filled/Outline + Color + Background Switcher */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
            {/* Style Toggle (Filled vs Outline) */}
            <div className="flex items-center rounded-lg bg-[#131826] border border-[#242C40] p-1">
              <button
                onClick={() => onSelectVariant('filled')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeVariant === 'filled'
                    ? 'bg-[#D4A24E] text-[#0B0E14] shadow-sm'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                Filled Silhouette
              </button>
              <button
                onClick={() => onSelectVariant('outline')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeVariant === 'outline'
                    ? 'bg-[#D4A24E] text-[#0B0E14] shadow-sm'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                Vector Outline
              </button>
            </div>

            {/* Color Selector */}
            <div className="flex items-center rounded-lg bg-[#131826] border border-[#242C40] p-1 gap-1">
              <span className="text-[#8B93A8] px-2 font-mono text-[11px]">Color:</span>
              <button
                onClick={() => setSelectedColor('#E3A63E')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                  selectedColor === '#E3A63E'
                    ? 'bg-[#E3A63E]/20 text-[#E3A63E] border border-[#E3A63E]/40 font-bold'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#E3A63E]"></span>
                Amber (#E3A63E)
              </button>
              <button
                onClick={() => setSelectedColor('#D4A24E')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                  selectedColor === '#D4A24E'
                    ? 'bg-[#D4A24E]/20 text-[#D4A24E] border border-[#D4A24E]/40 font-bold'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4A24E]"></span>
                Soft Amber (#D4A24E)
              </button>
              <button
                onClick={() => setSelectedColor('#FFFFFF')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                  selectedColor === '#FFFFFF'
                    ? 'bg-white/20 text-white border border-white/40 font-bold'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                Mono White
              </button>
            </div>

            {/* Background Canvas Mode */}
            <div className="flex items-center rounded-lg bg-[#131826] border border-[#242C40] p-1 gap-1">
              <span className="text-[#8B93A8] px-2 font-mono text-[11px]">Stage:</span>
              <button
                onClick={() => setPreviewBg('dark')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  previewBg === 'dark'
                    ? 'bg-[#0B0E14] text-white border border-[#242C40] font-bold'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                #0B0E14 Dark
              </button>
              <button
                onClick={() => setPreviewBg('navy')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  previewBg === 'navy'
                    ? 'bg-[#1B2233] text-white border border-[#242C40] font-bold'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                #131826 Navy
              </button>
              <button
                onClick={() => setPreviewBg('light')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  previewBg === 'light'
                    ? 'bg-[#F6F3ED] text-[#1B2233] border border-[#E2DCD2] font-bold'
                    : 'text-[#8B93A8] hover:text-white'
                }`}
              >
                Light Canvas
              </button>
            </div>
          </div>
        </div>

        {/* 3 Concepts Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {concepts.map((concept) => {
            const LogoComponent = concept.component;
            const isSelected = activeConcept === concept.id;

            return (
              <div
                key={concept.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between p-6 sm:p-7 relative ${
                  isSelected
                    ? 'bg-[#131826] border-2 border-[#D4A24E] shadow-xl shadow-[#D4A24E]/10'
                    : 'bg-[#111624] border-[#242C40] hover:border-[#8B93A8]/40'
                }`}
              >
                {/* Active Selection Badge */}
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#D4A24E] text-[#0B0E14] text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Active Site Logo</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Concept Header */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#1B2233] text-[#D4A24E] border border-[#242C40]">
                        {concept.badge}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">{concept.name}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#8B93A8] leading-relaxed min-h-[48px]">
                    {concept.description}
                  </p>

                  {/* 1. Large 200px Display Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8B93A8]">
                      <span>Large Scale Display</span>
                      <span>200 × 200 px</span>
                    </div>

                    <div
                      className={`h-[220px] rounded-xl border flex items-center justify-center transition-all p-4 ${getBgClass()}`}
                    >
                      <LogoComponent
                        size={200}
                        variant={activeVariant}
                        color={selectedColor}
                        showGlow={isSelected}
                      />
                    </div>
                  </div>

                  {/* 2. Micro 24px Display Area with Realistic UI Mockup Contexts */}
                  <div className="space-y-2 pt-2 border-t border-[#242C40]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8B93A8]">
                      <span>Micro Scalability</span>
                      <span>24 × 24 px</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Nav Bar Micro Context */}
                      <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#242C40] flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#1B2233] border border-[#242C40] flex items-center justify-center shrink-0">
                          <LogoComponent
                            size={24}
                            variant={activeVariant}
                            color={selectedColor}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            Cloud Police
                          </span>
                          <span className="text-[9px] font-mono text-[#8B93A8] block">
                            Navbar @ 24px
                          </span>
                        </div>
                      </div>

                      {/* Favicon / Tab Context */}
                      <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#242C40] flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#1B2233] border border-[#242C40] flex items-center justify-center shrink-0">
                          <LogoComponent
                            size={18}
                            variant={activeVariant}
                            color={selectedColor}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            cloud-police.io
                          </span>
                          <span className="text-[9px] font-mono text-[#8B93A8] block">
                            Favicon @ 18px
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Design Rationale Points */}
                  <div className="space-y-1.5 pt-1">
                    {concept.keyTraits.map((trait, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-[#E7EAF0]">
                        <Check className="w-3 h-3 text-[#3DD68C] shrink-0" />
                        <span>{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection Action Button */}
                <div className="pt-6 mt-4 border-t border-[#242C40]">
                  <button
                    onClick={() => onSelectConcept(concept.id)}
                    className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-[#D4A24E] text-[#0B0E14] shadow-md hover:bg-[#F5B44B]'
                        : 'border border-[#242C40] hover:border-[#D4A24E] text-[#E7EAF0] hover:text-white bg-[#1B2233]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Selected for Site & Console</span>
                      </>
                    ) : (
                      <span>Select {concept.name.split('—')[0].trim()}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
