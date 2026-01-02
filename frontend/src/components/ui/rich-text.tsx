'use client';

import React, { useState } from 'react';

interface RichTextProps {
  text: string;
  className?: string;
  imageClassName?: string;
}

// Web-compatible image formats
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function isWebCompatible(path: string): boolean {
  const lower = path.toLowerCase();
  return SUPPORTED_FORMATS.some(fmt => lower.endsWith(fmt));
}

/**
 * EquationImage component with fallback for unsupported formats
 */
function EquationImage({ src, className }: { src: string; className?: string }) {
  const [error, setError] = useState(false);
  const isSupported = isWebCompatible(src);

  // Show placeholder for unsupported formats (WMF, EMF, etc.)
  if (!isSupported || error) {
    return (
      <span
        className="inline-block bg-blue-100 text-blue-800 px-1 rounded text-xs mx-1"
        title="Equation (requires image conversion)"
      >
        [eq]
      </span>
    );
  }

  return (
    <img
      src={src}
      alt="equation"
      className={`inline-block align-middle mx-1 max-h-8 ${className || ''}`}
      style={{
        maxHeight: '2em',
        verticalAlign: 'middle',
        display: 'inline-block'
      }}
      onError={() => setError(true)}
    />
  );
}

/**
 * RichText component that renders text with embedded equation images
 * Parses [IMG:/uploads/...] patterns and renders them as images
 */
export function RichText({ text, className = '', imageClassName = '' }: RichTextProps) {
  if (!text) return null;

  // Pattern to match [IMG:/uploads/...] references
  const imgPattern = /\[IMG:(\/uploads\/[^\]]+)\]/g;

  // Split text by image patterns
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = imgPattern.exec(text)) !== null) {
    // Add text before the image
    if (match.index > lastIndex) {
      const textPart = text.substring(lastIndex, match.index);
      if (textPart.trim()) {
        parts.push(<span key={`text-${keyIndex++}`}>{textPart}</span>);
      }
    }

    // Add the image
    const imagePath = match[1];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const fullUrl = `${apiUrl}${imagePath}`;

    parts.push(
      <EquationImage
        key={`img-${keyIndex++}`}
        src={fullUrl}
        className={imageClassName}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText.trim()) {
      parts.push(<span key={`text-${keyIndex++}`}>{remainingText}</span>);
    }
  }

  // If no images found, just return the text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{parts}</span>;
}

/**
 * EquationImageBlock - larger version for block content (solutions, explanations)
 */
function EquationImageBlock({ src, className }: { src: string; className?: string }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isSupported = isWebCompatible(src);

  if (!isSupported || error) {
    return (
      <span
        className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mx-1"
        title="Equation (requires image conversion)"
      >
        [equation]
      </span>
    );
  }

  return (
    <img
      src={src}
      alt="solution image"
      className={`block my-2 ${className || 'max-h-64 w-auto rounded border'}`}
      style={{
        maxWidth: '100%',
        display: loaded ? 'block' : 'none'
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
}

/**
 * RichTextBlock - for block-level content with larger images
 */
export function RichTextBlock({ text, className = '', imageClassName = '' }: RichTextProps) {
  if (!text) return null;

  const imgPattern = /\[IMG:(\/uploads\/[^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = imgPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.substring(lastIndex, match.index);
      if (textPart.trim()) {
        parts.push(<span key={`text-${keyIndex++}`}>{textPart}</span>);
      }
    }

    const imagePath = match[1];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const fullUrl = `${apiUrl}${imagePath}`;

    parts.push(
      <EquationImageBlock
        key={`img-${keyIndex++}`}
        src={fullUrl}
        className={imageClassName}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText.trim()) {
      parts.push(<span key={`text-${keyIndex++}`}>{remainingText}</span>);
    }
  }

  if (parts.length === 0) {
    return <div className={className}>{text}</div>;
  }

  return <div className={className}>{parts}</div>;
}

export default RichText;
