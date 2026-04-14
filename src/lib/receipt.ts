const HOUR_RULE_REGEX = /(\d+)\s*hora/i;

export function formatBillingRuleLabel(regraAplicada?: string | null) {
  if (!regraAplicada) return "";

  if (/di[aá]ria/i.test(regraAplicada)) {
    return "DIÁRIA";
  }

  const hourMatch = regraAplicada.match(HOUR_RULE_REGEX);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    return `${hours} HORA${hours > 1 ? "S" : ""}`;
  }

  return regraAplicada.toUpperCase();
}
