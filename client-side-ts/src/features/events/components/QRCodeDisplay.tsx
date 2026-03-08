import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  /** The string value to encode */
  value: string;
  /** Size in pixels (default: 180) */
  size?: number;
  /** Background color (default: #FFFFFF) */
  bgColor?: string;
  /** Foreground/QR color (default: #074873 - Brand Blue) */
  fgColor?: string;
  /** Optional class name for the wrapper */
  className?: string;
}

/**
 * Shared QR Code component to ensure consistent branding and sizing.
 * Wraps 'react-qr-code' with project defaults.
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 180,
  bgColor = "#FFFFFF",
  fgColor = "#074873",
  className = "",
}) => {
  return (
    <div 
      className={`bg-white p-4 rounded-xl shadow-lg border border-slate-100 ${className}`}
      style={{ width: 'fit-content' }}
    >
      <QRCode
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="M" // Medium error correction is usually best for scanning
      />
    </div>
  );
};