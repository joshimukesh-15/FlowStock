import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * FlowStock Logo Mark — Precision Brand Geometric Mark
 * 
 * Geometry: Three bars of equal width and even height-steps growing left-to-right,
 * completing into a circle quadrant over a semi-circle base.
 * 
 * Palette: Warm Neutral Ramp (Smoky Black #11120D, Olive Drab #565449, Bone #D8CFBC, Floral White #FFFBF4)
 * - Light surface: Contrast up to 18.8:1
 * - Dark surface: Lifted palette for high contrast against #090A0C / #11120D
 * 
 * Variants:
 * - "auto": Adapts seamlessly between light & dark themes
 * - "light": Forced light gradient
 * - "dark": Forced lifted dark gradient
 * - "mono-dark": Flat Smoky Black (#11120D)
 * - "mono-light": Flat Floral White (#FFFBF4)
 * - "currentColor": Fills with currentColor
 */
export const Logomark = ({
  className = "w-6 h-6",
  variant = "auto",
  ...props
}) => {
  const uid = useId().replace(/:/g, "");

  // Base paths
  const dBase = "M125.03 252.5A125 125 0 0 0 374.97 252.5Z";
  const dB1 = "M132.5 207.5H137.5A30 30 0 0 1 167.5 237.5V247.5H162.5A30 30 0 0 1 132.5 217.5Z";
  const dB2 = "M172.5 172.5H177.5A30 30 0 0 1 207.5 202.5V247.5H202.5A30 30 0 0 1 172.5 217.5Z";
  const dB3 = "M212.5 137.5H217.5A30 30 0 0 1 247.5 167.5V247.5H242.5A30 30 0 0 1 212.5 217.5Z";
  const dQuad = "M252.5 247.5V125.03A125 125 0 0 1 374.97 247.5Z";

  if (variant === "currentColor" || variant === "mono-dark" || variant === "mono-light") {
    const fill =
      variant === "currentColor"
        ? "currentColor"
        : variant === "mono-dark"
        ? "#11120D"
        : "#FFFBF4";

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="120 120 260 260"
        className={cn("select-none shrink-0 inline-block", className)}
        role="img"
        aria-label="FlowStock Logo"
        {...props}
      >
        <path fill={fill} d={dBase} />
        <path fill={fill} d={dB1} />
        <path fill={fill} d={dB2} />
        <path fill={fill} d={dB3} />
        <path fill={fill} d={dQuad} />
      </svg>
    );
  }

  const lBaseId = `l-base-${uid}`;
  const lQuadId = `l-quad-${uid}`;
  const lC1Id = `l-c1-${uid}`;
  const lC2Id = `l-c2-${uid}`;
  const lC3Id = `l-c3-${uid}`;

  const dBaseId = `d-base-${uid}`;
  const dQuadId = `d-quad-${uid}`;
  const dC1Id = `d-c1-${uid}`;
  const dC2Id = `d-c2-${uid}`;
  const dC3Id = `d-c3-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="120 120 260 260"
      className={cn("select-none shrink-0 inline-block", className)}
      role="img"
      aria-label="FlowStock Logo"
      {...props}
    >
      <defs>
        {/* Light Mode Gradients */}
        <linearGradient id={lBaseId} gradientUnits="userSpaceOnUse" x1="250" y1="252.5" x2="250" y2="375">
          <stop offset="0" stopColor="#3C3B32" />
          <stop offset="1" stopColor="#11120D" />
        </linearGradient>
        <linearGradient id={lQuadId} gradientUnits="userSpaceOnUse" x1="252.5" y1="125" x2="375" y2="247.5">
          <stop offset="0" stopColor="#FFFBF4" />
          <stop offset="0.5" stopColor="#EFE8D8" />
          <stop offset="1" stopColor="#D8CFBC" />
        </linearGradient>
        <linearGradient id={lC1Id} gradientUnits="userSpaceOnUse" x1="132.5" y1="207.5" x2="167.5" y2="247.5">
          <stop offset="0" stopColor="#7A7768" />
          <stop offset="1" stopColor="#565449" />
        </linearGradient>
        <linearGradient id={lC2Id} gradientUnits="userSpaceOnUse" x1="172.5" y1="172.5" x2="207.5" y2="247.5">
          <stop offset="0" stopColor="#A39C86" />
          <stop offset="1" stopColor="#857F6C" />
        </linearGradient>
        <linearGradient id={lC3Id} gradientUnits="userSpaceOnUse" x1="212.5" y1="137.5" x2="247.5" y2="247.5">
          <stop offset="0" stopColor="#CFC6AE" />
          <stop offset="1" stopColor="#B4AC94" />
        </linearGradient>

        {/* Dark Mode Gradients (Lifted for contrast against near-black) */}
        <linearGradient id={dBaseId} gradientUnits="userSpaceOnUse" x1="250" y1="252.5" x2="250" y2="375">
          <stop offset="0" stopColor="#9C9480" />
          <stop offset="1" stopColor="#6E6A58" />
        </linearGradient>
        <linearGradient id={dQuadId} gradientUnits="userSpaceOnUse" x1="252.5" y1="125" x2="375" y2="247.5">
          <stop offset="0" stopColor="#FFFBF4" />
          <stop offset="0.5" stopColor="#FBF3DF" />
          <stop offset="1" stopColor="#EADFC4" />
        </linearGradient>
        <linearGradient id={dC1Id} gradientUnits="userSpaceOnUse" x1="132.5" y1="207.5" x2="167.5" y2="247.5">
          <stop offset="0" stopColor="#C9C0A6" />
          <stop offset="1" stopColor="#A39C86" />
        </linearGradient>
        <linearGradient id={dC2Id} gradientUnits="userSpaceOnUse" x1="172.5" y1="172.5" x2="207.5" y2="247.5">
          <stop offset="0" stopColor="#D9D1B8" />
          <stop offset="1" stopColor="#B9B096" />
        </linearGradient>
        <linearGradient id={dC3Id} gradientUnits="userSpaceOnUse" x1="212.5" y1="137.5" x2="247.5" y2="247.5">
          <stop offset="0" stopColor="#EDE6D2" />
          <stop offset="1" stopColor="#D4CAAE" />
        </linearGradient>
      </defs>

      {/* Light Mode Surface Render */}
      {(variant === "auto" || variant === "light") && (
        <g className={variant === "auto" ? "dark:hidden" : undefined}>
          <path fill={`url(#${lBaseId})`} d={dBase} />
          <path fill={`url(#${lC1Id})`} d={dB1} />
          <path fill={`url(#${lC2Id})`} d={dB2} />
          <path fill={`url(#${lC3Id})`} d={dB3} />
          <path fill={`url(#${lQuadId})`} d={dQuad} />
        </g>
      )}

      {/* Dark Mode Surface Render */}
      {(variant === "auto" || variant === "dark") && (
        <g className={variant === "auto" ? "hidden dark:inline" : undefined}>
          <path fill={`url(#${dBaseId})`} d={dBase} />
          <path fill={`url(#${dC1Id})`} d={dB1} />
          <path fill={`url(#${dC2Id})`} d={dB2} />
          <path fill={`url(#${dC3Id})`} d={dB3} />
          <path fill={`url(#${dQuadId})`} d={dQuad} />
        </g>
      )}
    </svg>
  );
};

export default Logomark;
