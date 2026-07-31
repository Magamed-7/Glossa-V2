const MESSAGES = {
  NETWORK: "No connection to the server. Check your connection and try again.",
  ACCOUNT_DEACTIVATED: "This account has been deactivated.",
  VALIDATION_ERROR: "Some of the entered data is invalid.",
  LIMIT_REACHED: "You've reached your plan's daily limit.",
  AI_ACCESS_DENIED: "AI chat isn't available on your current plan.",
  AI_LIMIT_REACHED: "You've used up today's AI conversation time.",
  INSUFFICIENT_FUNDS: "Your balance doesn't cover this — top up your wallet.",
  WRITER_LEVEL_REQUIRED: "Writing stories requires Upper-Intermediate (B2) level or above.",
  CANNOT_BUY_OWN_STORY: "You can't buy your own story.",
  ALREADY_PURCHASED: "You already own this story.",
};

export function errorText(error) {
  return MESSAGES[error?.code] || error?.message || "Something went wrong.";
}
