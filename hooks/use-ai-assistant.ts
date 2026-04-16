"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useGenerateLessonPlan() {
  return useMutation({
    mutationFn: async (data: {
      subject: string;
      chapter: string;
      topic: string;
      duration_minutes: number;
      class_level: number;
      board: string;
    }) => {
      const session = await api.post<any>("/api/v1/tutor/sessions", {
        subject: data.subject,
        concept_name: data.topic,
      });
      const sessionId = session?.data?.id ?? session?.id;
      const message = `Generate a detailed lesson plan for teaching "${data.topic}" from chapter "${data.chapter}" in ${data.subject} for Class ${data.class_level} (${data.board}). Duration: ${data.duration_minutes} minutes. Include: Learning Objectives, Warm-up Activity, Main Lesson, Practice Activity, Assessment, and Homework. Format with clear section headers.`;
      const response = await api.post<any>(
        `/api/v1/tutor/sessions/${sessionId}/messages`,
        { content: message }
      );
      return {
        text:
          response?.data?.response_text ??
          response?.response_text ??
          response?.data?.content ??
          "",
        session_id: sessionId,
        tokens_used: response?.data?.tokens_used ?? response?.tokens_used ?? 0,
        model_used: response?.data?.model_used ?? response?.model_used ?? "",
      };
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: async (data: {
      subject: string;
      chapter: string;
      topic: string;
      question_type: string;
      count: number;
      difficulty: string;
      class_level: number;
      marks_per_question: number;
    }) => {
      // Try the content generation endpoint; fallback to tutor session
      try {
        return await api.post<any>("/api/v1/content/generate-questions", data);
      } catch {
        // Fallback: use tutor session
        const session = await api.post<any>("/api/v1/tutor/sessions", {
          subject: data.subject,
          concept_name: data.topic,
        });
        const sessionId = session?.data?.id ?? session?.id;
        const message = `Generate ${data.count} ${data.question_type} questions about "${data.topic}" from "${data.chapter}" in ${data.subject} for Class ${data.class_level}. Difficulty: ${data.difficulty}. Marks per question: ${data.marks_per_question}. Format as JSON array with fields: question_text, options (for MCQ), correct_answer, explanation.`;
        const response = await api.post<any>(
          `/api/v1/tutor/sessions/${sessionId}/messages`,
          { content: message }
        );
        return {
          text:
            response?.data?.response_text ?? response?.response_text ?? "",
          questions: [],
        };
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
