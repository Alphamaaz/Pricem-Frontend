import { api, API_URL } from "./api";

export interface QuestionAuthor {
  _id: string;
  fullName: string;
}

export interface QuestionAnswerer {
  _id: string;
  fullName: string;
  storeName?: string;
}

export interface ProductQuestion {
  _id: string;
  product: string;
  seller: string;
  author: QuestionAuthor;
  question: string;
  answer?: string | null;
  answeredBy?: QuestionAnswerer | null;
  answeredAt?: string | null;
  status: "unanswered" | "answered" | "hidden";
  createdAt: string;
  updatedAt: string;
}

export interface QuestionListResponse {
  questions: ProductQuestion[];
  total: number;
  page: number;
  pages: number;
}

export async function listProductQuestions(productId: string, page = 1) {
  return api<QuestionListResponse>(`/questions/products/${productId}?page=${page}&limit=20`);
}

export async function listProductQuestionsServer(productId: string): Promise<QuestionListResponse> {
  try {
    const res = await fetch(`${API_URL}/questions/products/${productId}?page=1&limit=20`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return { questions: [], total: 0, page: 1, pages: 1 };
    return res.json();
  } catch {
    return { questions: [], total: 0, page: 1, pages: 1 };
  }
}

export async function askProductQuestion(productId: string, question: string) {
  return api<{ message: string; question: ProductQuestion }>(`/questions/products/${productId}`, {
    method: "POST",
    body: { question },
  });
}

export async function answerProductQuestion(questionId: string, answer: string) {
  return api<{ message: string; question: ProductQuestion }>(`/questions/${questionId}/answer`, {
    method: "POST",
    body: { answer },
  });
}
