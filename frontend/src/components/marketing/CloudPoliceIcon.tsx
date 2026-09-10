import React from 'react';

interface CloudPoliceIconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Clean, modern cloud-and-shield outline icon for Cloud Police.
 * Professional security infrastructure mark without mascot elements.
 */
export const CloudPoliceIcon: React.FC<CloudPoliceIconProps> = ({
  size = 24,
  className = '',
  color = 'currentColor',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Cloud Police Icon"
    >
      {/* Cloud perimeter outline */}
      <path
        d="M6.5 17C4.01472 17 2 14.9853 2 12.5C2 10.1564 3.79151 8.23129 6.07999 8.02436C6.77977 4.58882 9.82428 2 13.5 2C17.708 2 21.1966 5.09705 21.8797 9.17646C23.0963 9.87877 24 11.237 24 12.8C24 15.1196 22.1196 17 19.8 17H16.5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Integrated shield outline at bottom center */}
      <path
        d="M12 9.5L16.5 11.5V15.5C16.5 18.5 12 21 12 21C12 21 7.5 18.5 7.5 15.5V11.5L12 9.5Z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Subtle central checkmark inside shield */}
      <path
        d="M10.25 15L11.5 16.25L13.75 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
