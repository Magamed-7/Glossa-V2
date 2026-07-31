import { motion, useReducedMotion } from "motion/react";
import { useT } from "../../lib/i18n.jsx";

export default function Flashcard({ card, flipped, onFlip }) {
  const reduceMotion = useReducedMotion();
  const t = useT();

  return (
    <div className="[perspective:1200px]" style={{ height: 320 }}>
      <motion.div
        className="relative w-full h-full cursor-pointer [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label={flipped ? t("review.showWord") : t("review.showTranslation")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
      >
        <div className="absolute inset-0 neo-card flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
          <span className="font-display text-5xl text-center">{card.word}</span>
        </div>
        <div
          className="absolute inset-0 neo-card-secondary flex flex-col items-center justify-center gap-4 p-8 text-center [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <span className="font-display text-4xl text-secondary">{card.translation}</span>
          {card.example && <p className="font-body text-body-md italic opacity-70">&ldquo;{card.example}&rdquo;</p>}
        </div>
      </motion.div>
    </div>
  );
}
