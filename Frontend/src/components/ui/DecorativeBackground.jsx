const VARIANTS = {
  circles: (
    <>
      <div className="absolute top-20 right-[-100px] w-[600px] h-[600px] rounded-full border border-tertiary opacity-5" />
      <div className="absolute bottom-[-100px] left-[10%] w-[400px] h-[400px] border border-secondary opacity-10 rotate-45" />
    </>
  ),
  rays: (
    <>
      <div className="decorative-ray top-1/3" />
      <div className="decorative-ray top-2/3" />
    </>
  ),
  grid: (
    <div className="absolute inset-0 opacity-5 bg-[linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] bg-[size:40px_40px]" />
  ),
};

export default function DecorativeBackground({ variant = "circles" }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {VARIANTS[variant]}
    </div>
  );
}
