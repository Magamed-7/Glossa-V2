import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";

export default function CatalogIndex({ stories }) {
  if (stories.length === 0) return null;

  return (
    <div className="mt-section-gap">
      <h3 className="font-display text-headline-lg border-l-4 border-secondary pl-6 py-2 mb-6">
        Full Index.
      </h3>
      <ul className="divide-y-2 divide-surface-container-highest border-t-2 border-tertiary">
        {stories.map((story) => (
          <li key={story.id}>
            <Link
              to={`/stories/${story.id}`}
              className="flex items-center justify-between py-4 group hover:bg-surface-container transition-colors px-2"
            >
              <div className="flex items-center gap-4">
                <span className="font-label text-label-md border-2 border-tertiary px-2 py-0.5 uppercase">
                  {story.cefr_level}
                </span>
                <span className="font-headline text-lg group-hover:underline underline-offset-4">
                  {story.title}
                </span>
              </div>
              <Icon name="arrow_forward" className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
