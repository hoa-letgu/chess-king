export type KoRule = "simple" | "superko";

export function violatesKo(
  nextKey: string,
  history: string[],
  rule: KoRule
): boolean {
  if (rule === "simple") {
    return (
      history.length >= 2 &&
      nextKey === history[history.length - 2]
    );
  }

  // superko
  return history.includes(nextKey);
}
