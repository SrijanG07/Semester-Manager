import React from "react";

export const AmbientOrbs: React.FC = () => {
  return (
    <div className="ambient-orbs-container" aria-hidden="true">
      {/* Top-Left Violet/Indigo Ambient Orb */}
      <div className="orb-primary" />
      {/* Bottom-Right Cyan/Blue Ambient Orb */}
      <div className="orb-cyan" />
      {/* Mid-Right Neon Pink/Magenta Orb */}
      <div className="orb-magenta" />
      {/* Bottom-Left Amber Accent Orb */}
      <div className="orb-amber" />
    </div>
  );
};

export default AmbientOrbs;
