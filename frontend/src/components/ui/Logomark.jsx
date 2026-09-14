import React from "react";

export const Logomark = ({ className = "w-6 h-6", ...props }) => (
  <svg
    viewBox="0 0 100 100"
    role="img"
    aria-label="FlowStock logomark"
    className={className}
    {...props}
  >
    <title>FlowStock logomark — balanced node</title>
    <polygon points="50,8 16,29 16,71 50,92" fill="#23262F" />
    <polygon points="50,8 84,29 84,71 50,92" fill="#3A3E47" />
    <line x1="50" y1="8" x2="50" y2="92" stroke="#B6FF2E" strokeWidth="3" />
    <circle cx="50" cy="50" r="5" fill="#B6FF2E" />
  </svg>
);

export default Logomark;
