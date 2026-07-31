export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-margin-mobile relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-mustard" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full border border-navy" />
      </div>
      <div className="relative z-10 w-full flex justify-center">{children}</div>
      <div className="fixed bottom-8 left-margin-desktop hidden md:block max-w-[200px]" aria-hidden="true">
        <p className="font-label text-label-md text-navy/40 leading-relaxed">
          The Glossa Identity Portal uses advanced cryptographic protocols layered over mid-century aesthetic
          frameworks. Your session is monitored.
        </p>
      </div>
    </div>
  );
}
