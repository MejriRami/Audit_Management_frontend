import { Question } from "../types";

 
const BASE_URL = "http://localhost:8000/question";

export async function fetchQuestions() {
  const res = await fetch(BASE_URL);
  return res.json() as Promise<Question[]>;
}

export async function fetchQuestionsByQuestionnaire(questionnaire_id: number) {
  const res = await fetch(`${BASE_URL}/getAll/${questionnaire_id}`);
  return res.json() as Promise<Question[]>;
}

export async function createQuestion(
  question: Partial<Question>,
  questionnaire_id: number
) {
  const res = await fetch(`${BASE_URL}/${questionnaire_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });

  console.log("res", res);

  if (!res.ok) {
    const errResponse = await res.json();  
    const errorMessage = errResponse?.detail || "An unexpected error occurred";  // Get the detail message or fallback

    // Throw an error with the backend's detail message
    throw new Error(` ${errorMessage}`);
  }

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

export async function deleteQuestion(question_id: number) {
  const res = await fetch(`${BASE_URL}/${question_id}`, {
    method: "DELETE",
  });
  return res.json();
}
