import { Question } from "../types";

 
const BASE_URL = "http://localhost:8000/question";

export async function fetchQuestions() {
  const res = await fetch(BASE_URL);
  return res.json() as Promise<Question[]>;
}

export async function fetchQuestionsByVersion(versionId: number) {
  const res = await fetch(`${BASE_URL}/by_version/${versionId}`);
  return res.json() as Promise<Question[]>;
}

export async function createQuestion(question: Partial<Question>, versionId: number) {
  const res = await fetch(`${BASE_URL}?questionnaire_version_id=${versionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  return res.json() as Promise<Question>;
}

export async function updateQuestion(questionId: number, question: Partial<Question>) {
  const res = await fetch(`${BASE_URL}/${questionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  return res.json() as Promise<Question>;
}

export async function deleteQuestion(questionId: number) {
  const res = await fetch(`${BASE_URL}/${questionId}`, {
    method: "DELETE",
  });
  return res.json();
}
