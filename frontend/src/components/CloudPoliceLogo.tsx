import React from 'react';
import { CloudPoliceIcon } from './marketing/CloudPoliceIcon';

interface CloudPoliceLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export const CloudPoliceLogo: React.FC<CloudPoliceLogoProps> = ({
  size = 24,
  className = '',
  color = '#35B3AA',
}) => {
  return (
    <CloudPoliceIcon
      size={size}
      className={className}
      color={color}
    />
  );
};
