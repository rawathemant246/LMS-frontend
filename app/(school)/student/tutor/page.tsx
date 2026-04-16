"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Settings,
  Mic,
  ThumbsUp,
  Share2,
  RotateCcw,
  X,
  BookOpen,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Home,
  Search,
  Brain,
  FileText,
  ClipboardList,
  Library,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  AlertTriangle,
  Zap,
  Clock,
  Video,
  FileQuestion,
} from "lucide-react";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import { useStudentMastery } from "@/hooks/use-student-insights";
import {
  useTutorSessions,
  useCreateTutorSession,
  useTutorMessages,
  useSendTutorMessage,
  useRateSession,
  useCloseSession,
} from "@/hooks/use-tutor";
import { useSubjects } from "@/hooks/use-academic";
import { useLearningObjects } from "@/hooks/use-content";

/* ─────────────────────────────────────────────────────────
   Bouncing dots keyframes — injected once via <style>
   ───────────────────────────────────────────────────────── */
const bouncingDotsCSS = `
@keyframes tutorBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
  40% { transform: translateY(-5px); opacity: 1; }
}
`;

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */
interface TutorMessage {
  id: string;
  role: "user" | "ai" | "assistant" | "system";
  content: string;
  created_at?: string;
  hint?: string;
  learning_objects?: any[];
}

interface TutorSession {
  id: string;
  session_id?: string;
  subject?: string;
  subject_name?: string;
  concept_name?: string;
  topic?: string;
  status?: string;
  created_at?: string;
  message_count?: number;
  duration_minutes?: number;
  mastery_delta?: number;
}

/* ─────────────────────────────────────────────────────────
   Safe text rendering — React elements only, no innerHTML
   Converts **bold**, *italic*, and \n into React nodes.
   ───────────────────────────────────────────────────────── */
function renderMessageContent(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {renderInlineFormatting(line)}
    </Fragment>
  ));
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index));
    }
    if (m[2]) {
      parts.push(<strong key={`b-${m.index}`}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(<em key={`i-${m.index}`}>{m[3]}</em>);
    }
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getMasteryColor(pct: number): string {
  if (pct >= 70) return "#5cb87a";
  if (pct >= 45) return "#c8a060";
  return "#c07050";
}

function getSessionDuration(session: TutorSession | null): string {
  if (!session?.created_at) return "--";
  const start = new Date(session.created_at).getTime();
  const now = Date.now();
  const mins = Math.round((now - start) / 60000);
  if (mins < 1) return "< 1 min";
  return `${mins} min`;
}

function getTypeIcon(type?: string) {
  if (!type) return FileText;
  const t = type.toLowerCase();
  if (t.includes("video")) return Video;
  if (t.includes("quiz") || t.includes("practice")) return FileQuestion;
  return FileText;
}

/* ─────────────────────────────────────────────────────────
   Quick-action chips
   ───────────────────────────────────────────────────────── */
const quickChips = [
  { label: "Explain differently", icon: RotateCcw },
  { label: "Practice problems", icon: ClipboardList },
  { label: "Solved example", icon: GraduationCap },
  { label: "Related topics", icon: BookOpen },
];

/* ═════════════════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════════════════ */
export default function AITutorPage() {
  /* ── state ── */
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── data hooks ── */
  const { data: student } = useStudentProfile();
  const studentId = student?.student_id ?? student?.id;
  const studentName = student
    ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim()
    : "Student";
  const studentInitials = getInitials(studentName || "S");
  const studentClass = student?.class_name ?? student?.grade ?? "";

  const { data: sessionsRaw } = useTutorSessions();
  const sessions = useMemo(() => extractArray(sessionsRaw), [sessionsRaw]);

  const { data: subjectsRaw } = useSubjects();
  const subjects = useMemo(() => extractArray(subjectsRaw), [subjectsRaw]);

  const createSession = useCreateTutorSession();
  const sendMessage = useSendTutorMessage();
  const rateSession = useRateSession();
  const closeSession = useCloseSession();

  const { data: messagesRaw, refetch: refetchMessages } = useTutorMessages(
    activeSessionId ?? undefined,
  );
  const messages: TutorMessage[] = useMemo(
    () => extractArray(messagesRaw),
    [messagesRaw],
  );

  const activeSession: TutorSession | null = useMemo(() => {
    if (!activeSessionId) return null;
    return (
      sessions.find(
        (s: any) => (s.id ?? s.session_id) === activeSessionId,
      ) ?? null
    );
  }, [sessions, activeSessionId]);

  const activeTopic =
    activeSession?.concept_name ?? activeSession?.topic ?? "";

  const { data: masteryRaw } = useStudentMastery(studentId);
  const masteryItems = useMemo(() => extractArray(masteryRaw), [masteryRaw]);

  const { data: learningObjRaw } = useLearningObjects(
    activeSession?.topic ?? undefined,
  );
  const learningObjects = useMemo(
    () => extractArray(learningObjRaw),
    [learningObjRaw],
  );

  /* Recent topics from past sessions */
  const recentTopics = useMemo(() => {
    return sessions
      .filter((s: any) => s.concept_name || s.topic)
      .slice(0, 3)
      .map((s: any) => ({
        id: s.id ?? s.session_id,
        name: s.concept_name ?? s.topic ?? "Session",
      }));
  }, [sessions]);

  /* ── auto-resume last open session ── */
  useEffect(() => {
    if (activeSessionId) return;
    const openSession = sessions.find(
      (s: any) =>
        s.status === "open" || s.status === "active" || !s.status,
    );
    if (openSession) {
      setActiveSessionId(openSession.id ?? openSession.session_id);
    }
  }, [sessions, activeSessionId]);

  /* ── auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  /* ── handlers ── */
  const handleCreateSession = useCallback(
    (subject?: string, concept?: string) => {
      createSession.mutate(
        {
          subject: subject ?? subjects[0]?.name ?? "General",
          concept_name: concept ?? "New Topic",
        },
        {
          onSuccess: (data: any) => {
            const id = data?.id ?? data?.session_id ?? data?.data?.id;
            if (id) setActiveSessionId(id);
          },
        },
      );
    },
    [createSession, subjects],
  );

  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;

    if (!activeSessionId) {
      createSession.mutate(
        {
          subject: subjects[0]?.name ?? "General",
          concept_name: content.slice(0, 60),
        },
        {
          onSuccess: (data: any) => {
            const id = data?.id ?? data?.session_id ?? data?.data?.id;
            if (id) {
              setActiveSessionId(id);
              sendMessage.mutate(
                { sessionId: id, content },
                { onSuccess: () => refetchMessages() },
              );
            }
          },
        },
      );
    } else {
      sendMessage.mutate(
        { sessionId: activeSessionId, content },
        { onSuccess: () => refetchMessages() },
      );
    }

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [
    inputValue,
    activeSessionId,
    createSession,
    sendMessage,
    refetchMessages,
    subjects,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChip = useCallback(
    (label: string) => {
      if (!activeSessionId) return;
      sendMessage.mutate(
        { sessionId: activeSessionId, content: label },
        { onSuccess: () => refetchMessages() },
      );
    },
    [activeSessionId, sendMessage, refetchMessages],
  );

  const handleRate = useCallback(
    (rating: number) => {
      if (!activeSessionId) return;
      rateSession.mutate({ sessionId: activeSessionId, rating });
      setSelectedStar(rating);
      setRatingOpen(false);
    },
    [activeSessionId, rateSession],
  );

  const handleCloseSession = useCallback(() => {
    if (!activeSessionId) return;
    setRatingOpen(true);
  }, [activeSessionId]);

  const confirmClose = useCallback(() => {
    if (!activeSessionId) return;
    closeSession.mutate(activeSessionId, {
      onSuccess: () => {
        setActiveSessionId(null);
        setRatingOpen(false);
        setSelectedStar(0);
      },
    });
  }, [activeSessionId, closeSession]);

  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const activeSubjectTag = useMemo(() => {
    if (activeSession?.subject_name) return activeSession.subject_name;
    if (activeSession?.subject) return activeSession.subject;
    return subjects[0]?.name ?? "Mathematics";
  }, [activeSession, subjects]);

  const exchangeCount = useMemo(() => {
    return messages.filter((m) => m.role === "user").length;
  }, [messages]);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{bouncingDotsCSS}</style>

      <div className="fixed inset-0 z-50 flex bg-[#0e0e16] font-sans text-white overflow-hidden">
        {/* ── Ambient glow ── */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute -top-[10%] left-[25%] w-[55%] h-[65%] blur-[40px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(200,140,90,0.22) 0%, rgba(180,110,70,0.12) 30%, rgba(160,90,60,0.05) 55%, transparent 75%)",
            }}
          />
          <div
            className="absolute top-[10%] right-[5%] w-[35%] h-[45%] blur-[30px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(190,120,80,0.15) 0%, rgba(170,100,60,0.06) 40%, transparent 70%)",
            }}
          />
        </div>

        {/* ════════════════════════════════════════════════
           LEFT SIDEBAR
           ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="relative z-10 flex flex-col overflow-hidden border-r border-[rgba(255,255,255,0.04)] bg-[rgba(18,18,26,0.75)] backdrop-blur-[40px]"
              style={{ minWidth: 0 }}
            >
              <div className="flex flex-col h-full py-5 px-3.5">
                {/* Brand */}
                <div className="flex items-center gap-2.5 px-2 mb-7">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gradient-to-br from-[#c8956c] to-[#a67450] text-sm shadow-[0_2px_10px_rgba(200,149,108,0.25)]">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[15px] font-bold text-[#eee]">
                    EduPulse
                  </span>
                  <span className="ml-auto rounded-md bg-[rgba(200,149,108,0.12)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#c8956c]">
                    AI
                  </span>
                </div>

                {/* Nav --- Menu */}
                <NavSection label="Menu">
                  <NavItem
                    icon={Home}
                    label="Dashboard"
                    href="/student/dashboard"
                  />
                  <NavItem
                    icon={Search}
                    label="Content"
                    href="/student/content"
                  />
                  <NavItem icon={Brain} label="AI Tutor" active />
                </NavSection>

                {/* Nav --- Recent Topics */}
                <NavSection label="Recent Topics">
                  {recentTopics.length > 0 ? (
                    recentTopics.map((t: any) => (
                      <NavItem
                        key={t.id}
                        icon={BookOpen}
                        label={t.name}
                        onClick={() => setActiveSessionId(t.id)}
                      />
                    ))
                  ) : (
                    <p className="px-2.5 text-[11px] text-white/15">
                      No recent topics yet
                    </p>
                  )}
                </NavSection>

                {/* Nav --- Learning */}
                <NavSection label="Learning">
                  <NavItem
                    icon={ClipboardList}
                    label="Assignments"
                    href="/student/assignments"
                  />
                  <NavItem icon={BarChart3} label="My Progress" />
                  <NavItem icon={Library} label="Library" />
                </NavSection>

                {/* Bottom */}
                <div className="mt-auto border-t border-[rgba(255,255,255,0.04)] pt-3.5">
                  <NavItem icon={Settings} label="Settings" />
                  <NavItem icon={HelpCircle} label="Help center" />

                  <div className="mt-2 flex items-center gap-2.5 rounded-[9px] px-2 py-2 hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c87040] to-[#a05830] text-[12px] font-semibold text-white">
                      {studentInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-[#ddd]">
                        {studentName}
                      </div>
                      <div className="truncate text-[10px] text-white/20">
                        {studentClass
                          ? `Class ${studentClass}`
                          : student?.email ?? ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════
           CENTER --- MAIN CHAT
           ════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-1 flex-col min-w-0">
          {/* Header bar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgba(255,255,255,0.04)]">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.03] text-white/25 hover:bg-white/[0.07] hover:text-white/50 transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {activeSession ? (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-[#c8956c] shrink-0" />
                  <span className="text-[13px] font-medium text-white/50 truncate">
                    {activeTopic || "AI Tutor Session"}
                  </span>
                </div>
              ) : (
                <span className="text-[13px] text-white/25">
                  Start a new conversation
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {activeSession && (
                <>
                  <button
                    onClick={() => setRatingOpen(true)}
                    className="flex items-center gap-1 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-white/25 hover:bg-white/[0.07] hover:text-white/50 transition-colors"
                  >
                    <Star className="h-3 w-3" /> Rate
                  </button>
                  <button
                    onClick={handleCloseSession}
                    className="flex items-center gap-1 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-white/25 hover:bg-[rgba(200,80,80,0.1)] hover:text-red-400/60 transition-colors"
                  >
                    <X className="h-3 w-3" /> End
                  </button>
                </>
              )}
              <button
                onClick={() => handleCreateSession()}
                className="flex items-center gap-1 rounded-lg bg-[rgba(200,149,108,0.08)] px-2.5 py-1.5 text-[10.5px] font-medium text-[#c8956c] border border-[rgba(200,149,108,0.14)] hover:bg-[rgba(200,149,108,0.14)] transition-colors"
              >
                + New Chat
              </button>
              <button
                onClick={() => setContextOpen((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.03] text-white/25 hover:bg-white/[0.07] hover:text-white/50 transition-colors"
              >
                {contextOpen ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 flex flex-col gap-[18px] scrollbar-thin scrollbar-thumb-white/5">
            {/* Empty state */}
            {messages.length === 0 && !sendMessage.isPending && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67450] shadow-[0_4px_20px_rgba(200,149,108,0.3)]">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/60 mb-1">
                    Ask me anything
                  </h2>
                  <p className="text-[13px] text-white/20 max-w-sm">
                    I will guide you through concepts using the Socratic
                    method, helping you discover answers yourself.
                  </p>
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isAI =
                msg.role === "ai" ||
                msg.role === "assistant" ||
                msg.role === "system";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[72%] ${
                    isUser
                      ? "self-end flex-row-reverse"
                      : "self-start"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-white ${
                      isUser
                        ? "bg-gradient-to-br from-[#c87040] to-[#a05830] shadow-[0_2px_8px_rgba(200,112,64,0.2)] text-[11px] font-semibold"
                        : "bg-gradient-to-br from-[#c8956c] to-[#a67450] shadow-[0_2px_10px_rgba(200,149,108,0.25)] text-[13px] font-bold"
                    }`}
                  >
                    {isUser ? studentInitials : "E"}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    {/* Bubble */}
                    <div
                      className={`px-[17px] py-[13px] text-[13.5px] leading-[1.7] ${
                        isUser
                          ? "rounded-[16px_4px_16px_16px] bg-[rgba(200,149,108,0.14)] border border-[rgba(200,149,108,0.18)] text-[#e8cdb2]"
                          : "rounded-[4px_16px_16px_16px] bg-white/[0.04] border border-white/[0.06] text-[#c8c8cc]"
                      }`}
                    >
                      {renderMessageContent(msg.content)}
                    </div>

                    {/* Hint card */}
                    {isAI && msg.hint && (
                      <div className="flex gap-[7px] rounded-xl bg-[rgba(200,149,108,0.06)] border border-[rgba(200,149,108,0.09)] px-3.5 py-2.5 text-[11.5px] text-[#c8a07a] leading-relaxed">
                        <Zap className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#c8a07a]" />
                        <span>{msg.hint}</span>
                      </div>
                    )}

                    {/* Inline content cards */}
                    {isAI &&
                      msg.learning_objects &&
                      msg.learning_objects.length > 0 && (
                        <div className="flex gap-[7px] py-0.5">
                          {msg.learning_objects
                            .slice(0, 3)
                            .map((lo: any, i: number) => {
                              const Icon = getTypeIcon(lo.type);
                              return (
                                <div
                                  key={lo.id ?? i}
                                  className="w-[120px] rounded-[10px] overflow-hidden bg-white/[0.03] border border-white/[0.05] cursor-pointer transition-all duration-300 hover:border-[rgba(200,149,108,0.25)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                                >
                                  <div className="h-[68px] flex items-center justify-center bg-[rgba(200,149,108,0.06)]">
                                    <Icon className="h-6 w-6 text-[#c8956c]/60" />
                                  </div>
                                  <div className="px-2 py-1.5">
                                    <div className="text-[10.5px] font-medium text-[#ddd] truncate">
                                      {lo.title ?? lo.name ?? "Resource"}
                                    </div>
                                    <div className="text-[9.5px] text-white/25">
                                      {lo.type ?? "PDF"}{" "}
                                      {lo.size
                                        ? `\u00b7 ${lo.size}`
                                        : ""}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}

                    {/* Action buttons */}
                    {isAI && (
                      <div className="flex gap-0.5">
                        <ActionButton icon={ThumbsUp} />
                        <ActionButton icon={Share2} />
                        <ActionButton icon={RotateCcw} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {sendMessage.isPending && (
              <div className="flex items-center gap-2.5 self-start py-1">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67450] text-[13px] font-bold text-white shadow-[0_2px_10px_rgba(200,149,108,0.25)]">
                  E
                </div>
                <div className="flex items-center gap-1 text-white/25 text-[12px]">
                  <span
                    className="inline-block h-[5px] w-[5px] rounded-full bg-[#c8956c]"
                    style={{
                      animation: "tutorBounce 1.4s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="inline-block h-[5px] w-[5px] rounded-full bg-[#c8956c]"
                    style={{
                      animation:
                        "tutorBounce 1.4s ease-in-out 0.2s infinite",
                    }}
                  />
                  <span
                    className="inline-block h-[5px] w-[5px] rounded-full bg-[#c8956c]"
                    style={{
                      animation:
                        "tutorBounce 1.4s ease-in-out 0.4s infinite",
                    }}
                  />
                  <span className="ml-1 text-white/20">
                    Generating a response, please wait
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick-action chips */}
          {activeSessionId && messages.length > 0 && (
            <div className="flex gap-[5px] px-5 md:px-7 pb-2 flex-wrap">
              {quickChips.map((c) => (
                <button
                  key={c.label}
                  onClick={() => handleChip(c.label)}
                  className="flex items-center gap-1.5 rounded-[18px] border border-white/[0.05] bg-white/[0.025] px-[11px] py-[5px] text-[11px] font-medium text-white/30 transition-colors hover:bg-[rgba(200,149,108,0.07)] hover:border-[rgba(200,149,108,0.14)] hover:text-[#c8a07a]"
                >
                  <c.icon className="h-3 w-3" />
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input area ── */}
          <div className="px-5 md:px-7 pb-5 pt-3.5">
            <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.035] px-4 py-[13px] flex flex-col gap-2.5 transition-colors focus-within:border-[rgba(200,149,108,0.2)]">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  handleTextareaInput();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe what needs to be learned"
                rows={1}
                className="w-full min-h-[22px] resize-none bg-transparent text-[13.5px] text-[#ddd] placeholder:text-white/15 outline-none font-sans"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <InputTool icon={Paperclip} />
                  <InputTool icon={Settings} />

                  <div className="flex gap-[5px] ml-1.5">
                    <ContextTag label={activeSubjectTag} />
                    {studentClass && (
                      <ContextTag label={`Class ${studentClass}`} />
                    )}
                  </div>
                </div>

                <div className="flex gap-[5px]">
                  <button className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/[0.03] text-white/20 hover:bg-white/[0.07] hover:text-white/50 transition-colors">
                    <Mic className="h-[14px] w-[14px]" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sendMessage.isPending}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#c8956c] to-[#a67450] text-white shadow-[0_2px_10px_rgba(200,149,108,0.25)] transition-all hover:scale-105 hover:shadow-[0_4px_18px_rgba(200,149,108,0.35)] disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <Send className="h-[15px] w-[15px]" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-[9.5px] text-white/10 mt-[7px]">
              AI responses are for learning guidance only. Always verify with
              your textbook and teacher.{" "}
              <span className="underline text-[rgba(200,149,108,0.4)] cursor-pointer">
                Learn more
              </span>
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
           RIGHT --- CONTEXT PANEL
           ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {contextOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 265, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="relative z-10 overflow-y-auto overflow-x-hidden border-l border-[rgba(255,255,255,0.04)] bg-[rgba(18,18,26,0.6)] backdrop-blur-[40px]"
              style={{ minWidth: 0 }}
            >
              <div className="p-[14px_14px_18px]">
                {/* Mastery */}
                <ContextSection label="Your Mastery" icon={BarChart3}>
                  {masteryItems.length > 0 ? (
                    masteryItems.slice(0, 6).map((m: any, i: number) => {
                      const pct =
                        m.mastery_pct ?? m.percentage ?? m.score ?? 0;
                      const color = getMasteryColor(pct);
                      return (
                        <div
                          key={m.id ?? m.concept ?? i}
                          className="flex items-center gap-2 mb-2"
                        >
                          <span className="flex-1 text-[11.5px] text-white/40 truncate">
                            {m.concept_name ??
                              m.concept ??
                              m.topic ??
                              m.name ??
                              "Topic"}
                          </span>
                          <div className="w-[55px] h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span
                            className="text-[10.5px] font-semibold w-7 text-right"
                            style={{ color }}
                          >
                            {pct}%
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-white/15">
                      Start learning to track mastery
                    </p>
                  )}
                </ContextSection>

                {/* Related Content */}
                <ContextSection label="Related Content" icon={BookOpen}>
                  {learningObjects.length > 0 ? (
                    learningObjects
                      .slice(0, 4)
                      .map((lo: any, i: number) => {
                        const Icon = getTypeIcon(lo.type);
                        return (
                          <div
                            key={lo.id ?? i}
                            className="flex items-center gap-2.5 rounded-[9px] border border-white/[0.04] bg-white/[0.02] p-2.5 mb-[5px] cursor-pointer transition-colors hover:bg-[rgba(200,149,108,0.05)] hover:border-[rgba(200,149,108,0.1)]"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[rgba(200,149,108,0.08)]">
                              <Icon className="h-3.5 w-3.5 text-[#c8956c]/60" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11.5px] font-medium text-[#ddd] truncate">
                                {lo.title ?? lo.name ?? "Resource"}
                              </div>
                              <div className="text-[9.5px] text-white/20">
                                {lo.type ?? "PDF"}{" "}
                                {lo.size ? `\u00b7 ${lo.size}` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-[11px] text-white/15">
                      Content loads when a topic is active
                    </p>
                  )}
                </ContextSection>

                {/* Prerequisites */}
                <ContextSection label="Prerequisites" icon={AlertTriangle}>
                  {masteryItems.some(
                    (m: any) =>
                      (m.mastery_pct ?? m.percentage ?? m.score ?? 100) <
                      40,
                  ) ? (
                    <div className="rounded-[9px] bg-[rgba(200,149,108,0.04)] border border-[rgba(200,149,108,0.08)] p-2.5 text-[10.5px] text-[#c8a07a] leading-relaxed">
                      <strong>Gap detected: </strong>
                      {masteryItems
                        .filter(
                          (m: any) =>
                            (m.mastery_pct ??
                              m.percentage ??
                              m.score ??
                              100) < 40,
                        )
                        .slice(0, 2)
                        .map(
                          (m: any) =>
                            `${m.concept_name ?? m.concept ?? m.topic ?? "Topic"} at ${m.mastery_pct ?? m.percentage ?? m.score ?? 0}%`,
                        )
                        .join(", ")}
                      . Consider reviewing before continuing.
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/15">
                      No prerequisite gaps detected
                    </p>
                  )}
                </ContextSection>

                {/* Session */}
                <ContextSection label="Session" icon={Zap}>
                  <div className="text-[11px] text-white/25 leading-[1.7]">
                    {activeSession ? (
                      <>
                        Session #{sessions.indexOf(activeSession) + 1}{" "}
                        {"\u00b7"} {getSessionDuration(activeSession)}
                        <br />
                        {exchangeCount} exchange
                        {exchangeCount !== 1 ? "s" : ""} {"\u00b7"}{" "}
                        Socratic mode
                        <br />
                        {activeSession.mastery_delta != null && (
                          <span
                            className={
                              activeSession.mastery_delta >= 0
                                ? "text-[#5cb87a]"
                                : "text-[#c07050]"
                            }
                          >
                            {activeSession.mastery_delta >= 0 ? "+" : ""}
                            {activeSession.mastery_delta}% mastery this
                            session
                          </span>
                        )}
                      </>
                    ) : (
                      "No active session"
                    )}
                  </div>
                </ContextSection>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════
           RATING MODAL
           ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {ratingOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setRatingOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl border border-white/[0.06] bg-[rgba(18,18,26,0.95)] backdrop-blur-[40px] p-6 w-[320px] text-center"
              >
                <h3 className="text-[15px] font-semibold text-white/70 mb-2">
                  Rate this session
                </h3>
                <p className="text-[12px] text-white/25 mb-4">
                  How helpful was the AI tutor?
                </p>

                <div className="flex justify-center gap-1.5 mb-5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoveredStar(n)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => handleRate(n)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          n <= (hoveredStar || selectedStar)
                            ? "text-[#c8956c] fill-[#c8956c]"
                            : "text-white/10"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRatingOpen(false)}
                    className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] py-2 text-[12px] text-white/30 hover:bg-white/[0.07] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClose}
                    className="flex-1 rounded-xl bg-gradient-to-br from-[#c8956c] to-[#a67450] py-2 text-[12px] font-medium text-white shadow-[0_2px_10px_rgba(200,149,108,0.25)] hover:shadow-[0_4px_18px_rgba(200,149,108,0.35)] transition-all"
                  >
                    End Session
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────── */

function NavSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="px-2.5 mb-1.5 text-[9.5px] font-semibold uppercase tracking-[1.3px] text-white/20">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const cls = `flex items-center gap-[9px] rounded-[9px] px-2.5 py-2 cursor-pointer text-[13px] font-medium transition-colors mb-px ${
    active
      ? "bg-[rgba(200,149,108,0.1)] text-[#d4aa82]"
      : "text-white/35 hover:bg-white/[0.04] hover:text-white/60"
  }`;

  const inner = (
    <>
      <Icon className="h-[17px] w-[17px] shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <div className={cls} onClick={onClick}>
      {inner}
    </div>
  );
}

function ActionButton({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <button className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-white/[0.025] text-white/20 hover:bg-white/[0.07] hover:text-white/50 transition-colors">
      <Icon className="h-[11px] w-[11px]" />
    </button>
  );
}

function InputTool({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <button className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-white/[0.03] text-white/20 hover:bg-white/[0.07] hover:text-white/50 transition-colors">
      <Icon className="h-[13px] w-[13px]" />
    </button>
  );
}

function ContextTag({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-[7px] border border-[rgba(200,149,108,0.14)] bg-[rgba(200,149,108,0.08)] px-2 py-[3px] text-[10.5px] font-medium text-[#c8a07a]">
      {label}
      <X className="h-[9px] w-[9px] opacity-40 cursor-pointer" />
    </span>
  );
}

function ContextSection({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[22px]">
      <div className="flex items-center gap-1.5 mb-2.5 text-[9.5px] font-bold uppercase tracking-[1px] text-white/20">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  );
}
