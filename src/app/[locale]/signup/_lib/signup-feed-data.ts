/**
 * Mock recent-signup feed for the social-proof panel on /signup.
 *
 * TODO(backend): replace with real data from a future
 * `GET /platform/pulse/recent-signups` endpoint that returns the last
 * N completed activations, anonymized (first name + initial only,
 * city, segment, age in minutes). LGPD: never expose full name or PII.
 */

export interface SignupFeedEntry {
  readonly name: string;
  readonly city: string;
  readonly trade: string;
  readonly mins: number;
}

export const SIGNUP_FEED: readonly SignupFeedEntry[] = [
  { name: "Maria L.", city: "São Paulo, SP", trade: "Barbearia", mins: 2 },
  { name: "Rafael S.", city: "Belo Horizonte, MG", trade: "Estúdio tattoo", mins: 4 },
  { name: "Camila R.", city: "Recife, PE", trade: "Cabeleireira", mins: 7 },
  { name: "Juliana P.", city: "Porto Alegre, RS", trade: "Clínica", mins: 11 },
  { name: "Thiago M.", city: "Curitiba, PR", trade: "Estética", mins: 14 },
  { name: "Beatriz O.", city: "Fortaleza, CE", trade: "Barbearia", mins: 18 },
  { name: "André C.", city: "Rio de Janeiro, RJ", trade: "Studio fitness", mins: 22 },
];
