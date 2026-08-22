export default function QuestionForm({ questions, answers, onChange }) {
  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <div key={q.id}>
          {q.text && <p className="font-body text-body-md mb-3">{q.text}</p>}
          {q.options ? (
            <div className="flex flex-col gap-2">
              {q.options.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`grammar-question-${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => onChange(q.id, option)}
                  />
                  <span className="font-body text-body-md">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              className="w-full bg-surface-container-low border-2 border-tertiary px-4 py-3 font-body text-body-md outline-none focus:border-secondary"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={answers[q.id] || ""}
              onChange={(e) => onChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
