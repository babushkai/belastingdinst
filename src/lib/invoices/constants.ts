export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["paid", "overdue", "void"],
  overdue: ["paid", "void"],
  paid: [],
  void: [],
};
