export interface BusinessVertical {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly tagsCount: number;
  readonly customFieldsCount: number;
  readonly faqsCount: number;
}

export interface IBusinessVerticalService {
  list(): Promise<readonly BusinessVertical[]>;
}
