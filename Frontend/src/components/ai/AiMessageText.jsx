function renderInline(text, keyPrefix) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyPrefix}-b${i}`}>{part}</strong> : <span key={`${keyPrefix}-t${i}`}>{part}</span>
  );
}

function isBulletLine(line) {
  return /^[-*]\s+/.test(line);
}

function isNumberedLine(line) {
  return /^\d+[.)]\s+/.test(line);
}

export default function AiMessageText({ text }) {
  // A message with no text at all should render as nothing, not crash the whole chat
  // on text.split — the server can legitimately hand back an empty reply.
  if (typeof text !== "string" || text.trim() === "") return null;

  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').filter((line) => line.trim() !== '');
        if (lines.length === 0) return null;

        if (lines.every(isBulletLine)) {
          return (
            <ul key={blockIndex} className="list-disc pl-5 space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^[-*]\s+/, ''), `${blockIndex}-${i}`)}</li>
              ))}
            </ul>
          );
        }

        if (lines.every(isNumberedLine)) {
          return (
            <ol key={blockIndex} className="list-decimal pl-5 space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^\d+[.)]\s+/, ''), `${blockIndex}-${i}`)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {lines.map((line, i) => (
              <span key={i}>
                {renderInline(line, `${blockIndex}-${i}`)}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
