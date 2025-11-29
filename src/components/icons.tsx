import type { SVGProps } from 'react';

export function DorexAi(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="256"
      height="256"
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <path
        d="M128 24C68.45 24 24 68.45 24 128C24 187.55 68.45 232 128 232C187.55 232 232 187.55 232 128C232 68.45 187.55 24 128 24Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M106 82V174H142C165.73 174 184 153.18 184 128C184 102.82 165.73 82 142 82H106Z"
        fill="white"
      />
    </svg>
  );
}


export const Icons = {
  logo: DorexAi,
};

export default Icons;
