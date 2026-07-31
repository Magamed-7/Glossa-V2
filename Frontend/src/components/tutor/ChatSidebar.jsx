import { useEffect, useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import { useApi } from "../../lib/useApi.js";
import { getMyErrors } from "../../lib/api/ai.js";

export default function ChatSidebar({ messages, scenario, language, sessionId }) {
  const { data: recentErrors } = useApi(() => getMyErrors(), []);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionId) return undefined;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const userMessages = messages.filter((m) => m.role === "user" && m.corrections !== null);
  const cleanCount = userMessages.filter((m) => !m.corrections || m.corrections.length === 0).length;
  const accuracy = userMessages.length > 0 ? Math.round((cleanCount / userMessages.length) * 100) : null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="space-y-6">
      <NeoCard>
        <h3 className="font-headline text-headline-md mb-2">Accuracy</h3>
        <p className="font-display text-4xl text-secondary">{accuracy === null ? "—" : `${accuracy}%`}</p>
        <p className="font-body text-body-md opacity-70 mt-1">This session</p>
      </NeoCard>

      <NeoCard>
        <h3 className="font-headline text-headline-md mb-4">Recent Mistakes</h3>
        {recentErrors && recentErrors.length > 0 ? (
          <ul className="space-y-2">
            {recentErrors.slice(0, 5).map((err) => (
              <li key={err.id} className="font-body text-body-md">
                <span className="line-through opacity-60">{err.original}</span>
                <span className="text-secondary"> → {err.corrected}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-body-md opacity-70">No mistakes recorded yet.</p>
        )}
      </NeoCard>

      <NeoCard variant="accent">
        <h3 className="font-headline text-headline-md mb-2">Session</h3>
        <dl className="space-y-2 font-body text-body-md">
          <div className="flex justify-between">
            <dt className="opacity-70">Scenario</dt>
            <dd className="capitalize">{scenario}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-70">Language</dt>
            <dd>{language}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="opacity-70">Duration</dt>
            <dd className="font-ledger">
              {minutes}:{String(seconds).padStart(2, "0")}
            </dd>
          </div>
        </dl>
      </NeoCard>
    </div>
  );
}
