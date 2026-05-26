export type SurveyQuestionKind =
  | "short_text"
  | "long_text"
  | "number"
  | "date"
  | "single_choice"
  | "multiple_choice"
  | "section_header";

export type SurveyQuestion = {
  id: string;
  kind: SurveyQuestionKind;
  title: string;
  required: boolean;
  options: string[] | null;
  sortOrder: number;
};

/** Ответ клиента на анкету — то, что специалист видит read-only. */
export type SurveyResponseRow = {
  id: string;
  surveyId: string;
  surveyName: string;
  alfaCustomerId: string;
  clientName: string;
  childName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SurveyResponseDetail = {
  id: string;
  surveyName: string;
  clientName: string;
  childName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  questions: SurveyQuestion[];
  answers: {
    questionId: string;
    questionTitle: string;
    questionKind: SurveyQuestionKind;
    questionOptions: string[] | null;
    value: unknown;
  }[];
};

export function formatSurveyDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatAnswerValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return (value as string[]).join(", ");
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  return String(value);
}
