import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PRICE_OPTIONS = [
  { value: "", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export default function FilterPanel({ filters, onChange }) {
  const [open, setOpen] = useState(false);

  function update(patch) {
    onChange({ ...filters, ...patch });
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-24 right-8 md:bottom-8 w-14 h-14 bg-tertiary text-surface rounded-full border-2 border-tertiary hard-shadow flex items-center justify-center z-40"
        onClick={() => setOpen(true)}
        aria-label="Filter stories"
      >
        <Icon name="tune" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Filter Stories">
        <div className="space-y-6">
          <div>
            <p className="font-label text-label-md uppercase mb-2">Level</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-3 py-1 border-2 border-tertiary font-label text-label-md ${
                  !filters.level ? "bg-secondary text-on-secondary" : ""
                }`}
                onClick={() => update({ level: "" })}
              >
                All
              </button>
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`px-3 py-1 border-2 border-tertiary font-label text-label-md ${
                    filters.level === level ? "bg-secondary text-on-secondary" : ""
                  }`}
                  onClick={() => update({ level })}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-label text-label-md uppercase mb-2">Price</p>
            <div className="flex gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-3 py-1 border-2 border-tertiary font-label text-label-md ${
                    filters.price === opt.value ? "bg-secondary text-on-secondary" : ""
                  }`}
                  onClick={() => update({ price: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <NeoButton className="w-full" onClick={() => setOpen(false)}>
            Apply
          </NeoButton>
        </div>
      </Modal>
    </>
  );
}
