import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { SCENARIOS } from "../../lib/scenarios.js";

export default function LockedDossiers() {
  return (
    <div className="mt-section-gap relative border-2 border-tertiary p-8 md:p-12 overflow-hidden">
      <span className="absolute top-6 right-[-40px] rotate-12 bg-tertiary text-surface font-label text-label-md uppercase tracking-widest px-10 py-2">
        Exclusive Access
      </span>
      <h2 className="font-display text-headline-lg mb-2">Locked Dossiers</h2>
      <p className="font-body text-body-md text-on-surface-variant mb-8 max-w-md">
        Upgrade your plan to unlock unlimited AI conversation practice across every scenario.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.code} className="relative border-2 border-tertiary aspect-[4/3] overflow-hidden">
            <img
              className="w-full h-full object-cover grayscale opacity-50"
              src={scenario.image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={800}
              height={600}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-tertiary/50">
              <Icon name="lock" className="text-surface text-3xl" />
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/pricing"
        className="inline-block mt-8 bg-secondary text-on-secondary border-2 border-tertiary px-8 py-4 font-label text-label-md uppercase tracking-widest hard-shadow btn-press transition-all"
      >
        View Plans
      </Link>
    </div>
  );
}
