import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 ${
        glow ? 'shadow-[0_0_30px_rgba(16,185,129,0.05)] border-emerald-500/20' : ''
      } ${className}`}
      {...props}
    >
      {glow && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return <div className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props}>{children}</div>;
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight text-white ${className}`} {...props}>{children}</h3>;
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => {
  return <p className={`text-sm text-slate-400 ${className}`} {...props}>{children}</p>;
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return <div className={`${className}`} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return <div className={`mt-6 flex items-center ${className}`} {...props}>{children}</div>;
};
