export type ScoringRuleDefinition = {
  id: number;
  key: string;
  name: string;
  points: number;
};

export const defaultScoringRules: ScoringRuleDefinition[] = [
  {
    id: 1,
    key: "referralGiven",
    name: "Referral Given",
    points: 10,
  },
  {
    id: 2,
    key: "referralReceived",
    name: "Referral Received",
    points: 5,
  },
];

export function getScoringPointsMap() {
  return new Map(defaultScoringRules.map((rule) => [rule.key, rule.points]));
}
