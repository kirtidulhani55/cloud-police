import React from 'react';

export type LogoConceptId = 'concept-a' | 'concept-b' | 'concept-c';
export type LogoVariant = 'filled' | 'outline';

export interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  color?: string;
  className?: string;
  showGlow?: boolean;
}

/**
 * Concept A — Shield Negative Space
 * Shape the bottom curve of the cloud so the negative space between
 * its two lower lobes forms a subtle shield outline. One cohesive silhouette.
 */
export const ConceptALogo: React.FC<LogoProps> = ({
  size = 32,
  variant = 'filled',
  color = '#E3A63E',
  className = '',
  showGlow = false,
}) => {
  const isOutline = variant === 'outline';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Cloud Police - Concept A: Shield Negative Space"
    >
      {showGlow && (
        <defs>
          <filter id="glowA" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>
      )}

      {isOutline ? (
        // Outline Mode for Concept A
        <path
          d="M14 46C9.58 46 6 42.42 6 38C6 33.9 9.08 30.52 13.12 30.06C14.28 20.98 22.02 14 31.5 14C41.34 14 49.32 21.36 50.1 31.06C54.54 31.78 58 35.62 58 40.24C58 45.08 54.08 49 49.24 49H41.5C39.5 49 37.8 47.8 37 46C35.8 43.3 34.2 40.5 32 38.5C29.8 40.5 28.2 43.3 27 46C26.2 47.8 24.5 49 22.5 49H14C11.79 49 10 47.21 10 45"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={showGlow ? 'url(#glowA)' : undefined}
        />
      ) : (
        // Filled Mode for Concept A (Cohesive silhouette with shield negative space at bottom-center)
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M31.5 14C22.02 14 14.28 20.98 13.12 30.06C9.08 30.52 6 33.9 6 38C6 42.42 9.58 46 14 46H22.5C24.5 46 26.2 44.8 27 43C28.2 40.3 29.8 37.5 32 35.5C34.2 37.5 35.8 40.3 37 43C37.8 44.8 39.5 46 41.5 46H49.24C54.08 46 58 42.08 58 37.24C58 32.62 54.54 28.78 50.1 28.06C49.32 18.36 41.34 11 31.5 11C23.2 11 16.2 16.5 14 24C13.7 24 13.4 24 13.12 24.06M31.5 14C22.02 14 14.28 20.98 13.12 30.06C9.08 30.52 6 33.9 6 38C6 42.42 9.58 46 14 46H22.5C24.5 46 26.2 44.8 27 43C28.2 40.3 29.8 37.5 32 35.5C34.2 37.5 35.8 40.3 37 43C37.8 44.8 39.5 46 41.5 46H49.24C54.08 46 58 42.08 58 37.24C58 32.62 54.54 28.78 50.1 28.06C49.32 18.36 41.34 11 31.5 11"
          fill={color}
          filter={showGlow ? 'url(#glowA)' : undefined}
        />
      )}
    </svg>
  );
};

/**
 * Concept B — Checkpoint Cloud
 * A cloud silhouette with a single thin horizontal line or gate-bar
 * across its lower third, suggesting a checkpoint/control point.
 */
export const ConceptBLogo: React.FC<LogoProps> = ({
  size = 32,
  variant = 'filled',
  color = '#E3A63E',
  className = '',
  showGlow = false,
}) => {
  const isOutline = variant === 'outline';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Cloud Police - Concept B: Checkpoint Cloud"
    >
      {showGlow && (
        <defs>
          <filter id="glowB" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>
      )}

      {isOutline ? (
        // Outline Mode: Cloud outline with clean checkpoint gate line & nodes
        <g filter={showGlow ? 'url(#glowB)' : undefined}>
          <path
            d="M12 42C8.13 42 5 38.87 5 35C5 31.36 7.78 28.36 11.37 28.04C12.82 19.34 20.35 12.5 29.5 12.5C39.02 12.5 46.81 19.82 47.9 29.28C51.92 30.14 55 33.7 55 38C55 42.97 50.97 47 46 47H18C14.69 47 12 44.31 12 41"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Checkpoint Gate Bar */}
          <line
            x1="8"
            y1="42"
            x2="56"
            y2="42"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Checkpoint Node Pins */}
          <circle cx="20" cy="42" r="2.5" fill={color} />
          <circle cx="44" cy="42" r="2.5" fill={color} />
        </g>
      ) : (
        // Filled Mode: Solid cloud silhouette sliced with a high-precision checkpoint gate-bar
        <g filter={showGlow ? 'url(#glowB)' : undefined}>
          <path
            d="M29.5 12.5C20.35 12.5 12.82 19.34 11.37 28.04C7.78 28.36 5 31.36 5 35C5 38.1 7.02 40.73 9.87 41.63L9.87 40H54.13C54.68 39.38 55 38.58 55 37.7C55 33.4 51.92 29.84 47.9 28.98C46.81 19.52 39.02 12.2 29.5 12.2V12.5Z"
            fill={color}
          />
          {/* Checkpoint Grounding Base */}
          <rect x="12" y="45" width="40" height="5" rx="2.5" fill={color} />
          {/* Checkpoint Barrier Beam with anchor nodes */}
          <rect x="6" y="40.5" width="52" height="3" rx="1.5" fill={color} />
        </g>
      )}
    </svg>
  );
};

/**
 * Concept C — Shield-Notch Cloud
 * A cloud outline with a small angular notch or chevron cut into the bottom-center,
 * giving it a subtle shield-like point at the base without adding a separate badge element.
 */
export const ConceptCLogo: React.FC<LogoProps> = ({
  size = 32,
  variant = 'filled',
  color = '#E3A63E',
  className = '',
  showGlow = false,
}) => {
  const isOutline = variant === 'outline';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Cloud Police - Concept C: Shield-Notch Cloud"
    >
      {showGlow && (
        <defs>
          <filter id="glowC" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>
      )}

      {isOutline ? (
        // Outline Mode: Continuous cloud silhouette with bottom angular shield-notch point
        <path
          d="M14 45C9.58 45 6 41.42 6 37C6 32.9 9.08 29.52 13.12 29.06C14.28 19.98 22.02 13 31.5 13C41.34 13 49.32 20.36 50.1 30.06C54.54 30.78 58 34.62 58 39.24C58 44.08 54.08 48 49.24 48H37L31.5 54.5L26 48H14C11.79 48 10 46.21 10 44"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={showGlow ? 'url(#glowC)' : undefined}
        />
      ) : (
        // Filled Mode: Solid cloud silhouette with integrated downward shield crest notch
        <path
          d="M31.5 13C22.02 13 14.28 19.98 13.12 29.06C9.08 29.52 6 32.9 6 37C6 41.42 9.58 45 14 45H26L31.5 51.5L37 45H49.24C54.08 45 58 41.08 58 36.24C58 31.62 54.54 27.78 50.1 27.06C49.32 17.36 41.34 10 31.5 10C23.2 10 16.2 15.5 14 23C13.7 23 13.4 23 13.12 23.06L13.12 29.06"
          fill={color}
          filter={showGlow ? 'url(#glowC)' : undefined}
        />
      )}
    </svg>
  );
};

/**
 * Universal Brand Logo Component
 * Renders the chosen concept with scalable size, variant, and color.
 */
export const BrandLogo: React.FC<
  LogoProps & { concept?: LogoConceptId }
> = ({ concept = 'concept-a', ...props }) => {
  switch (concept) {
    case 'concept-b':
      return <ConceptBLogo {...props} />;
    case 'concept-c':
      return <ConceptCLogo {...props} />;
    case 'concept-a':
    default:
      return <ConceptALogo {...props} />;
  }
};
