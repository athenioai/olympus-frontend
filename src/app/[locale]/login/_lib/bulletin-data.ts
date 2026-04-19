/**
 * Mock data for the editorial login bulletin.
 *
 * TODO(backend): replace these literals with real tenant data once the
 * read-only "platform pulse" endpoints land. See handoff README §"Known
 * mock dependencies to cut before prod".
 */

export interface ChatMessage {
  readonly who: "them" | "us";
  readonly name: string;
  readonly time: string;
  readonly text: string;
}

export interface FinanceItem {
  readonly name: string;
  readonly service: string;
  readonly amount: number;
  readonly status: "paid" | "pending";
  readonly time: string;
}

export interface AgendaSlot {
  readonly time: string;
  readonly name: string;
  readonly service: string;
  readonly kind: "new" | "confirmed" | "free";
  readonly highlight?: boolean;
}

export const CHAT_MESSAGES: readonly ChatMessage[] = [
  { who: "them", name: "Camila M.", time: "03:42", text: "Oi! Tem horário amanhã de manhã?" },
  { who: "us", name: "Olympus", time: "03:42", text: "Tenho sim, Camila. Quarta 09:00 ou 10:30, qual te serve melhor?" },
  { who: "them", name: "Camila M.", time: "03:45", text: "10:30. Pode mandar o pix?" },
  { who: "us", name: "Olympus", time: "03:45", text: "Feito. Link enviado, confirmação automática ao pagar." },
  { who: "them", name: "Camila M.", time: "03:47", text: "Pago. Obrigada!" },
];

export const FINANCE_ITEMS: readonly FinanceItem[] = [
  { name: "Camila M.", service: "Consulta", amount: 280, status: "paid", time: "03:47" },
  { name: "Studio Flor", service: "Pacote trimestral", amount: 1890, status: "paid", time: "04:33" },
  { name: "Pedro H.", service: "Retorno", amount: 180, status: "paid", time: "04:58" },
  { name: "Mariana L.", service: "Sessão avulsa", amount: 320, status: "pending", time: "05:14" },
  { name: "Bruno V.", service: "Consulta", amount: 170, status: "paid", time: "05:22" },
];

export const AGENDA_SLOTS: readonly AgendaSlot[] = [
  { time: "09:00", name: "Helena R.", service: "Consulta inicial", kind: "new" },
  { time: "10:30", name: "Camila M.", service: "Consulta", kind: "confirmed", highlight: true },
  { time: "11:15", name: "Pedro H.", service: "Retorno", kind: "confirmed" },
  { time: "14:00", name: "—", service: "horário livre", kind: "free" },
  { time: "15:30", name: "Ana P.", service: "Primeira sessão", kind: "new" },
  { time: "16:45", name: "Bruno V.", service: "Consulta", kind: "confirmed" },
  { time: "18:00", name: "—", service: "horário livre", kind: "free" },
];
