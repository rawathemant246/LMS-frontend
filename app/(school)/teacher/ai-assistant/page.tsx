"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  BarChart3,
  Library,
  Copy,
  Download,
  Printer,
  RefreshCw,
  Check,
  Plus,
  Loader2,
  Wand2,
  BrainCircuit,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useTeacherProfile,
  useMySubjects,
} from "@/hooks/use-teacher-context";
import { useChapters, useTopics } from "@/hooks/use-content";
import {
  useGenerateLessonPlan,
  useGenerateQuiz,
} from "@/hooks/use-ai-assistant";
import { useCreateQuestion } from "@/hooks/use-exams";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items) return data.items;
  return [];
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ---------------------------------------------------------------------------
// CSS-in-JS keyframes (injected once)
// ---------------------------------------------------------------------------

const STYLE_ID = "ai-assistant-keyframes";

function useInjectKeyframes() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes sparkle-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.95); }
      }
      @keyframes shimmer-slide {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes float-orb {
        0%, 100% { transform: translateY(0) translateX(0); }
        25% { transform: translateY(-12px) translateX(6px); }
        50% { transform: translateY(-6px) translateX(-4px); }
        75% { transform: translateY(-16px) translateX(2px); }
      }
      @keyframes glow-border {
        0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.15), 0 0 40px rgba(139, 92, 246, 0.05); }
        50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.25), 0 0 60px rgba(139, 92, 246, 0.1); }
      }
      .animate-sparkle { animation: sparkle-pulse 2s ease-in-out infinite; }
      .animate-shimmer {
        background-size: 200% auto;
        animation: shimmer-slide 3s linear infinite;
      }
      .animate-float-orb { animation: float-orb 6s ease-in-out infinite; }
      .animate-glow-border { animation: glow-border 3s ease-in-out infinite; }

      .typewriter-cursor::after {
        content: '|';
        animation: sparkle-pulse 1s step-end infinite;
        color: rgb(139, 92, 246);
        font-weight: 300;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Typewriter hook
// ---------------------------------------------------------------------------

function useTypewriter(text: string, speed = 8) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setIsDone(false);
      indexRef.current = 0;
      return;
    }
    setDisplayed("");
    setIsDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      const chunk = Math.min(indexRef.current * speed, text.length);
      setDisplayed(text.slice(0, chunk));
      if (chunk >= text.length) {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text, speed]);

  const skipToEnd = useCallback(() => {
    setDisplayed(text);
    setIsDone(true);
  }, [text]);

  return { displayed, isDone, skipToEnd };
}

// ---------------------------------------------------------------------------
// Tool Card definitions
// ---------------------------------------------------------------------------

interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  glowColor: string;
  borderGlow: string;
  active: boolean;
}

const TOOLS: ToolDef[] = [
  {
    id: "lesson",
    name: "Lesson Planner",
    description: "Generate structured lesson plans aligned to your curriculum",
    icon: "lesson",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    glowColor: "rgba(139, 92, 246, 0.3)",
    borderGlow: "border-violet-500/30",
    active: true,
  },
  {
    id: "quiz",
    name: "Quiz Generator",
    description: "Create auto-graded questions from any topic instantly",
    icon: "quiz",
    gradient: "from-emerald-600 via-green-600 to-teal-700",
    glowColor: "rgba(16, 185, 129, 0.3)",
    borderGlow: "border-emerald-500/30",
    active: true,
  },
  {
    id: "insights",
    name: "Class Insights",
    description: "AI-analyzed patterns in student performance data",
    icon: "insights",
    gradient: "from-amber-600 via-orange-600 to-yellow-700",
    glowColor: "rgba(245, 158, 11, 0.2)",
    borderGlow: "border-amber-500/20",
    active: false,
  },
  {
    id: "summarizer",
    name: "Content Summarizer",
    description: "Distill chapters into concise study material",
    icon: "summarizer",
    gradient: "from-pink-600 via-rose-600 to-red-700",
    glowColor: "rgba(236, 72, 153, 0.2)",
    borderGlow: "border-pink-500/20",
    active: false,
  },
];

function ToolIcon({ id, className }: { id: string; className?: string }) {
  const cls = className ?? "h-6 w-6";
  switch (id) {
    case "lesson":
      return <BookOpen className={cls} />;
    case "quiz":
      return <HelpCircle className={cls} />;
    case "insights":
      return <BarChart3 className={cls} />;
    case "summarizer":
      return <Library className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

// ---------------------------------------------------------------------------
// Section parser for lesson plan display
// ---------------------------------------------------------------------------

interface ParsedSection {
  title: string;
  content: string;
}

function parseSections(text: string): ParsedSection[] {
  const lines = text.split("\n");
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of lines) {
    // Detect section headers: lines starting with # or ** or all-caps followed by colon
    const headerMatch =
      line.match(/^#{1,3}\s+(.+)/) ||
      line.match(/^\*\*(.+?)\*\*\s*$/) ||
      line.match(/^([A-Z][A-Z\s]{3,}):?\s*$/);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: headerMatch[1].replace(/\*\*/g, "").trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    } else {
      // Content before first header
      if (!sections.length && line.trim()) {
        current = { title: "", content: line + "\n" };
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ---------------------------------------------------------------------------
// Quiz question parser
// ---------------------------------------------------------------------------

interface ParsedQuestion {
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

function parseQuizQuestions(text: string): ParsedQuestion[] {
  // Try JSON parse first
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fall through to text parsing
  }

  // Simple text-based parsing
  const questions: ParsedQuestion[] = [];
  const blocks = text.split(/(?:^|\n)(?:Q?\d+[\.\)]\s)/);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.trim().split("\n");
    const qText = lines[0] || "";
    const options: string[] = [];
    let answer = "";
    let explanation = "";
    for (const line of lines.slice(1)) {
      const optMatch = line.match(/^[A-Da-d][\.\)]\s*(.+)/);
      const ansMatch = line.match(/(?:Answer|Correct):\s*(.+)/i);
      const expMatch = line.match(/(?:Explanation):\s*(.+)/i);
      if (optMatch) options.push(optMatch[1]);
      if (ansMatch) answer = ansMatch[1];
      if (expMatch) explanation = expMatch[1];
    }
    if (qText) {
      questions.push({
        question_text: qText,
        options: options.length > 0 ? options : undefined,
        correct_answer: answer,
        explanation,
      });
    }
  }
  return questions;
}

// ---------------------------------------------------------------------------
// Print helper (DOM-safe)
// ---------------------------------------------------------------------------

function openPrintWindow(text: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  const doc = win.document;
  const styleEl = doc.createElement("style");
  styleEl.textContent =
    "body{font-family:system-ui,sans-serif;line-height:1.7;max-width:700px;margin:2rem auto;padding:0 1rem;color:#1e1b4b}h1,h2,h3{color:#4f46e5;margin-top:1.5rem}";
  doc.head.appendChild(styleEl);
  const titleEl = doc.createElement("title");
  titleEl.textContent = "Lesson Plan";
  doc.head.appendChild(titleEl);
  const pre = doc.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.textContent = text;
  doc.body.appendChild(pre);
  doc.close();
  win.print();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] p-8 md:p-10 mb-8"
    >
      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl animate-float-orb" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-purple-400/10 blur-2xl animate-float-orb" style={{ animationDelay: "4s" }} />

      {/* Mesh pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px, 60px 60px, 50px 50px",
        }}
      />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 animate-sparkle">
            <Sparkles className="h-6 w-6 text-violet-300" />
          </div>
          <div>
            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight animate-shimmer"
              style={{
                backgroundImage: "linear-gradient(90deg, #c4b5fd, #818cf8, #a78bfa, #c4b5fd, #818cf8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI Assistant
            </h1>
            <p className="text-sm md:text-base text-indigo-200/70 font-medium mt-0.5">
              AI-powered tools to supercharge your teaching
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ToolCardGrid({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {TOOLS.map((tool) => {
        const isSelected = selected === tool.id;
        const isDisabled = !tool.active;

        return (
          <motion.div
            key={tool.id}
            variants={fadeSlideUp}
            whileHover={
              tool.active
                ? { scale: 1.03, y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }
                : undefined
            }
            whileTap={tool.active ? { scale: 0.98 } : undefined}
          >
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => tool.active && onSelect(tool.id)}
              className="w-full text-left focus:outline-none group"
            >
              <div
                className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-500 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                    : isSelected
                    ? `bg-gradient-to-br ${tool.gradient} text-white border-transparent animate-glow-border`
                    : `bg-white border-gray-200 hover:border-transparent hover:shadow-xl`
                }`}
                style={
                  !isDisabled && !isSelected
                    ? {
                        transition: "box-shadow 0.4s ease, border-color 0.3s ease",
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (!isDisabled && !isSelected) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${tool.glowColor}, 0 8px 32px rgba(0,0,0,0.08)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled && !isSelected) {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                  }
                }}
              >
                {/* Background gradient accent for unselected */}
                {!isSelected && tool.active && (
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                )}

                <div className="relative z-10">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl mb-3 ${
                    isSelected
                      ? "bg-white/20 backdrop-blur-sm"
                      : `bg-gradient-to-br ${tool.gradient} shadow-sm`
                  }`}>
                    <ToolIcon
                      id={tool.icon}
                      className="h-5 w-5 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className={`text-sm font-bold ${isSelected ? "text-white" : "text-foreground"}`}>
                      {tool.name}
                    </h3>
                    {isSelected && (
                      <Badge className="bg-white/20 text-white border-white/20 text-[10px] px-1.5 py-0">
                        Active
                      </Badge>
                    )}
                    {isDisabled && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-200 text-gray-500">
                        Coming Soon
                      </Badge>
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed ${
                    isSelected ? "text-white/80" : "text-muted-foreground"
                  }`}>
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Lesson Plan Form
// ---------------------------------------------------------------------------

function LessonPlanForm({
  subjects,
  onGenerate,
  isLoading,
}: {
  subjects: any[];
  onGenerate: (data: any) => void;
  isLoading: boolean;
}) {
  const [subjectId, setSubjectId] = useState<string>("");
  const [chapterId, setChapterId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [duration, setDuration] = useState(40);
  const [classLevel, setClassLevel] = useState<string>("");
  const [board, setBoard] = useState<string>("");

  const { data: chaptersRaw } = useChapters(subjectId || undefined);
  const { data: topicsRaw } = useTopics(chapterId || undefined);

  const chapters = useMemo(() => extractArray(chaptersRaw), [chaptersRaw]);
  const topics = useMemo(() => extractArray(topicsRaw), [topicsRaw]);

  const selectedSubject = subjects.find((s: any) => s.subject_id === subjectId);
  const selectedChapter = chapters.find((c: any) => c.id === chapterId);
  const selectedTopic = topics.find((t: any) => t.id === topicId);

  const canSubmit = subjectId && chapterId && topicId && duration > 0 && classLevel && board;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onGenerate({
      subject: selectedSubject?.subject_name ?? "Subject",
      chapter: selectedChapter?.name ?? selectedChapter?.title ?? "Chapter",
      topic: selectedTopic?.name ?? selectedTopic?.title ?? "Topic",
      duration_minutes: duration,
      class_level: parseInt(classLevel),
      board,
    });
  };

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" exit="exit">
      <Card className="border border-violet-200/50 bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/30 shadow-lg shadow-violet-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-foreground">Lesson Planner</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => {
                  setSubjectId(v ?? "");
                  setChapterId("");
                  setTopicId("");
                }}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>
                      {s.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chapter</Label>
              <Select
                value={chapterId}
                onValueChange={(v) => {
                  setChapterId(v ?? "");
                  setTopicId("");
                }}
                disabled={!subjectId}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder={subjectId ? "Select chapter" : "Select subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name ?? c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topic</Label>
              <Select
                value={topicId}
                onValueChange={(v) => setTopicId(v ?? "")}
                disabled={!chapterId}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder={chapterId ? "Select topic" : "Select chapter first"} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name ?? t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (min)</Label>
              <Input
                type="number"
                min={10}
                max={120}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 40)}
                className="h-9 bg-white"
              />
            </div>

            {/* Class Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Level</Label>
              <Select value={classLevel} onValueChange={(v) => setClassLevel(v ?? "")}>
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Class {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Board */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Board</Label>
              <Select value={board} onValueChange={(v) => setBoard(v ?? "")}>
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
                  <SelectItem value="State Board">State Board</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              disabled={!canSubmit || isLoading}
              onClick={handleSubmit}
              className="h-10 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Lesson Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Quiz Generator Form
// ---------------------------------------------------------------------------

function QuizGeneratorForm({
  subjects,
  onGenerate,
  isLoading,
}: {
  subjects: any[];
  onGenerate: (data: any) => void;
  isLoading: boolean;
}) {
  const [subjectId, setSubjectId] = useState<string>("");
  const [chapterId, setChapterId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [questionType, setQuestionType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [classLevel, setClassLevel] = useState<string>("");

  const { data: chaptersRaw } = useChapters(subjectId || undefined);
  const { data: topicsRaw } = useTopics(chapterId || undefined);

  const chapters = useMemo(() => extractArray(chaptersRaw), [chaptersRaw]);
  const topics = useMemo(() => extractArray(topicsRaw), [topicsRaw]);

  const selectedSubject = subjects.find((s: any) => s.subject_id === subjectId);
  const selectedChapter = chapters.find((c: any) => c.id === chapterId);
  const selectedTopic = topics.find((t: any) => t.id === topicId);

  const canSubmit = subjectId && chapterId && topicId && classLevel && count > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onGenerate({
      subject: selectedSubject?.subject_name ?? "Subject",
      chapter: selectedChapter?.name ?? selectedChapter?.title ?? "Chapter",
      topic: selectedTopic?.name ?? selectedTopic?.title ?? "Topic",
      question_type: questionType,
      count,
      difficulty,
      class_level: parseInt(classLevel),
      marks_per_question: marksPerQuestion,
    });
  };

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" exit="exit">
      <Card className="border border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 shadow-lg shadow-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-foreground">Quiz Generator</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => {
                  setSubjectId(v ?? "");
                  setChapterId("");
                  setTopicId("");
                }}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>
                      {s.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chapter</Label>
              <Select
                value={chapterId}
                onValueChange={(v) => {
                  setChapterId(v ?? "");
                  setTopicId("");
                }}
                disabled={!subjectId}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder={subjectId ? "Select chapter" : "Select subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name ?? c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topic</Label>
              <Select
                value={topicId}
                onValueChange={(v) => setTopicId(v ?? "")}
                disabled={!chapterId}
              >
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder={chapterId ? "Select topic" : "Select chapter first"} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name ?? t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Level</Label>
              <Select value={classLevel} onValueChange={(v) => setClassLevel(v ?? "")}>
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      Class {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question Type</Label>
              <Select value={questionType} onValueChange={(v) => setQuestionType(v ?? "mcq")}>
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                  <SelectItem value="long_answer">Long Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "medium")}>
                <SelectTrigger className="w-full h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Number of Questions</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="h-9 bg-white"
              />
            </div>

            {/* Marks per question */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marks per Question</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(parseInt(e.target.value) || 1)}
                className="h-9 bg-white"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              disabled={!canSubmit || isLoading}
              onClick={handleSubmit}
              className="h-10 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Lesson Plan Result Panel
// ---------------------------------------------------------------------------

function LessonPlanResult({
  text,
  onRegenerate,
  isRegenerating,
}: {
  text: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const { displayed, isDone, skipToEnd } = useTypewriter(text, 12);
  const [copied, setCopied] = useState(false);
  const sections = useMemo(() => parseSections(displayed), [displayed]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lesson-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    openPrintWindow(text);
  };

  const sectionColors = [
    "border-l-violet-500 bg-violet-50/40",
    "border-l-indigo-500 bg-indigo-50/40",
    "border-l-blue-500 bg-blue-50/40",
    "border-l-purple-500 bg-purple-50/40",
    "border-l-fuchsia-500 bg-fuchsia-50/40",
    "border-l-pink-500 bg-pink-50/40",
  ];

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-violet-200/40 bg-white shadow-xl shadow-violet-500/5 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        <CardContent className="p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <BrainCircuit className="h-3.5 w-3.5 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border-violet-200 font-semibold text-xs">
                <Sparkles className="h-3 w-3 mr-1 animate-sparkle" />
                AI Generated
              </Badge>
            </div>

            {!isDone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={skipToEnd}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip animation
              </Button>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.length > 0 ? (
              sections.map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`border-l-4 rounded-lg p-4 ${sectionColors[i % sectionColors.length]}`}
                >
                  {section.title && (
                    <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] font-bold text-violet-600 shadow-sm border border-violet-200">
                        {i + 1}
                      </span>
                      {section.title}
                    </h4>
                  )}
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-[system-ui]">
                    {section.content.trim()}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className={`text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap ${!isDone ? "typewriter-cursor" : ""}`}>
                {displayed}
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Quiz Result Panel
// ---------------------------------------------------------------------------

function QuizResult({
  data,
  onRegenerate,
  isRegenerating,
}: {
  data: any;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const rawText = data?.text ?? data?.data?.text ?? "";
  const rawQuestions: ParsedQuestion[] = useMemo(() => {
    const fromApi = data?.questions ?? data?.data?.questions ?? data?.data?.items ?? [];
    if (Array.isArray(fromApi) && fromApi.length > 0) return fromApi;
    if (rawText) return parseQuizQuestions(rawText);
    return [];
  }, [data, rawText]);

  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const createQuestion = useCreateQuestion();

  const toggleReveal = (idx: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCopy = async () => {
    const text = rawQuestions
      .map(
        (q, i) =>
          `Q${i + 1}. ${q.question_text}\n${
            q.options ? q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}. ${o}`).join("\n") : ""
          }\nAnswer: ${q.correct_answer}\nExplanation: ${q.explanation}`
      )
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAllToBank = async () => {
    setAddingAll(true);
    let added = 0;
    for (const q of rawQuestions) {
      try {
        await createQuestion.mutateAsync({
          question_text: q.question_text,
          question_type: q.options ? "mcq" : "short_answer",
          options: q.options ?? [],
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: "medium",
          marks: 1,
        });
        added++;
      } catch {
        // continue with next question
      }
    }
    setAddingAll(false);
    if (added > 0) toast.success(`${added} question(s) added to Question Bank`);
  };

  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="border border-emerald-200/40 bg-white shadow-xl shadow-emerald-500/5 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 font-semibold text-xs">
                <Sparkles className="h-3 w-3 mr-1 animate-sparkle" />
                AI Generated
              </Badge>
              <span className="text-xs text-muted-foreground">{rawQuestions.length} question(s)</span>
            </div>
          </div>

          {/* Questions */}
          {rawQuestions.length > 0 ? (
            <div className="space-y-4">
              {rawQuestions.map((q, i) => {
                const revealed = revealedAnswers.has(i);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-4 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-sm">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-relaxed">
                          {q.question_text}
                        </p>

                        {/* MCQ options */}
                        {q.options && q.options.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, j) => (
                              <div
                                key={j}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                                  revealed && q.correct_answer?.includes(String.fromCharCode(65 + j))
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
                                    : "border-gray-200 bg-white text-foreground/80"
                                }`}
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold">
                                  {String.fromCharCode(65 + j)}
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer toggle */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleReveal(i)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {revealed ? "Hide Answer" : "Show Answer"}
                          </button>
                        </div>

                        <AnimatePresence>
                          {revealed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/50 p-3 space-y-1">
                                {q.correct_answer && (
                                  <p className="text-xs font-semibold text-violet-800">
                                    Answer: <span className="font-bold">{q.correct_answer}</span>
                                  </p>
                                )}
                                {q.explanation && (
                                  <p className="text-xs text-violet-700/80 leading-relaxed">
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : rawText ? (
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {rawText}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No questions generated. Try again.</p>
          )}

          {/* Action bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy All"}
            </Button>
            {rawQuestions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAllToBank}
                disabled={addingAll}
                className="text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {addingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add All to Question Bank
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AIAssistantPage() {
  useInjectKeyframes();

  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile();
  const teacherId = teacher?.id;
  const subjects = useMySubjects(teacherId);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Lesson plan state
  const lessonPlan = useGenerateLessonPlan();
  const [lessonResult, setLessonResult] = useState<string | null>(null);
  const [lastLessonParams, setLastLessonParams] = useState<any>(null);

  // Quiz state
  const quiz = useGenerateQuiz();
  const [quizResult, setQuizResult] = useState<any>(null);
  const [lastQuizParams, setLastQuizParams] = useState<any>(null);

  const handleSelectTool = (id: string) => {
    setSelectedTool((prev) => (prev === id ? null : id));
  };

  const handleGenerateLesson = async (params: any) => {
    setLastLessonParams(params);
    setLessonResult(null);
    const result = await lessonPlan.mutateAsync(params);
    setLessonResult(result.text);
  };

  const handleRegenerateLesson = () => {
    if (lastLessonParams) handleGenerateLesson(lastLessonParams);
  };

  const handleGenerateQuiz = async (params: any) => {
    setLastQuizParams(params);
    setQuizResult(null);
    const result = await quiz.mutateAsync(params);
    setQuizResult(result);
  };

  const handleRegenerateQuiz = () => {
    if (lastQuizParams) handleGenerateQuiz(lastQuizParams);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader />

      {/* Tool Cards */}
      <ToolCardGrid selected={selectedTool} onSelect={handleSelectTool} />

      {/* Active Tool Form */}
      <AnimatePresence mode="wait">
        {selectedTool === "lesson" && (
          <div key="lesson-form" className="mb-8">
            <LessonPlanForm
              subjects={subjects}
              onGenerate={handleGenerateLesson}
              isLoading={lessonPlan.isPending}
            />
          </div>
        )}
        {selectedTool === "quiz" && (
          <div key="quiz-form" className="mb-8">
            <QuizGeneratorForm
              subjects={subjects}
              onGenerate={handleGenerateQuiz}
              isLoading={quiz.isPending}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {(lessonPlan.isPending || quiz.isPending) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-8"
          >
            <Card className="border border-violet-200/30 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/40 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-400 animate-shimmer" style={{ backgroundSize: "200% auto" }} />
              <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <BrainCircuit className="h-7 w-7 text-white animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 rounded-2xl bg-violet-400/20 blur-xl animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">AI is thinking...</p>
                  <p className="text-xs text-muted-foreground mt-1">Generating high-quality content for you</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {lessonResult && (
          <div key="lesson-result" className="mb-8">
            <LessonPlanResult
              text={lessonResult}
              onRegenerate={handleRegenerateLesson}
              isRegenerating={lessonPlan.isPending}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quizResult && (
          <div key="quiz-result" className="mb-8">
            <QuizResult
              data={quizResult}
              onRegenerate={handleRegenerateQuiz}
              isRegenerating={quiz.isPending}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Empty state when no tool selected */}
      {!selectedTool && !lessonResult && !quizResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16"
        >
          <div className="relative inline-block">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto shadow-sm border border-violet-200/50">
              <Wand2 className="h-9 w-9 text-violet-400" />
            </div>
            <div className="absolute -inset-3 rounded-3xl bg-violet-200/30 blur-2xl -z-10" />
          </div>
          <h3 className="text-base font-bold text-foreground mt-5">Select a tool to get started</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
            Choose from the AI-powered tools above to generate lesson plans, quizzes, and more
          </p>
        </motion.div>
      )}
    </div>
  );
}
