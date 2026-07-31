import Icon from "./Icon.jsx";
import NeoButton from "./NeoButton.jsx";

// Использует error.message напрямую. Модуль errorText (задача 3.2) позже даёт человеческие
// тексты по коду ошибки — тогда заменить error.message на errorText(error), сигнатура не изменится.
export default function ErrorState({ error, onRetry }) {
  const message = error?.message || "Something went wrong";

  return (
    <div className="border-2 border-error p-8 flex flex-col items-center text-center gap-4">
      <Icon name="error" className="text-error text-4xl" />
      <p className="font-body text-body-md text-error">{message}</p>
      {onRetry && (
        <NeoButton variant="ghost" size="md" onClick={onRetry}>
          Try again
        </NeoButton>
      )}
    </div>
  );
}
