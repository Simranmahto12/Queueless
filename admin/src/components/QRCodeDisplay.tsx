import React, { useEffect, useState } from 'react';
import { generateQRCodeDataURL } from '@queueless/shared';
import { Loader2, AlertCircle } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  margin?: number;
  alt?: string;
}

/**
 * Authentic, standards-compliant 2D matrix barcode (QR code) component.
 * Encodes the token payload into an ISO/IEC 18004 compliant scannable barcode
 * that any physical scanner, kiosk camera, or smartphone can decode.
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 140,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
  margin = 1,
  alt = 'Queue QR Code Pass',
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setIsLoading(false);
      setDataUrl(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    generateQRCodeDataURL(value, {
      width: Math.max(size * 2, 240), // 2x sharp resolution for mobile camera scanning
      margin,
      color: { dark: darkColor, light: lightColor },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'QR render error');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor, margin]);

  if (isLoading) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 animate-pulse ${className}`}
      >
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center bg-rose-50 rounded-xl border border-rose-200 text-rose-500 p-2 text-center ${className}`}
      >
        <AlertCircle className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium leading-tight">Unable to generate QR code</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`block rounded-lg shadow-xs select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, imageRendering: 'pixelated' }}
    />
  );
};
