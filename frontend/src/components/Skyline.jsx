export default function Skyline({ className = "" }) {
  return (
    <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="20" y="90" width="50" height="110" />
        <rect x="80" y="50" width="40" height="150" />
        <rect x="130" y="110" width="60" height="90" />
        <rect x="200" y="30" width="45" height="170" />
        <rect x="255" y="80" width="55" height="120" />
        <rect x="320" y="60" width="40" height="140" />
        <rect x="370" y="100" width="70" height="100" />
        <rect x="450" y="20" width="45" height="180" />
        <rect x="505" y="70" width="55" height="130" />
        <rect x="570" y="95" width="45" height="105" />
        <rect x="625" y="45" width="50" height="155" />
        <rect x="685" y="85" width="45" height="115" />
        <rect x="740" y="65" width="40" height="135" />
      </g>
    </svg>
  );
}