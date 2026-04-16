export interface BusinessFaq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateFaqPayload {
  readonly question: string;
  readonly answer: string;
}

export interface UpdateFaqPayload {
  readonly question?: string;
  readonly answer?: string;
}

export interface IBusinessFaqService {
  list(): Promise<BusinessFaq[]>;
  create(payload: CreateFaqPayload): Promise<BusinessFaq>;
  update(id: string, payload: UpdateFaqPayload): Promise<BusinessFaq>;
  remove(id: string): Promise<void>;
}
