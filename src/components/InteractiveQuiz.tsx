import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, RefreshCw, Trophy, Sparkles, Award, ArrowRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Question {
  id?: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizData {
  quiz: boolean;
  title: string;
  description?: string;
  questions: Question[];
}

interface InteractiveQuizProps {
  data: QuizData;
  onRestart?: () => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ data, onRestart }) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<number>(0);

  const questions = data?.questions || [];
  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return null;
  }

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();
  const percentage = Math.round((score / totalQuestions) * 100);
  const isAllAnswered = Object.keys(userAnswers).length === totalQuestions;

  const handleReset = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setActiveQuestion(0);
    if (onRestart) onRestart();
  };

  const getGradeInfo = () => {
    if (percentage === 100) return { title: 'Perfekt!', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', text: 'Ausgezeichnet! Alle Antworten sind korrekt.' };
    if (percentage >= 80) return { title: 'Sehr gut!', badge: 'bg-blue-900/30 text-blue-300 border-blue-500/30', text: 'Großartige Leistung, fast alles richtig!' };
    if (percentage >= 50) return { title: 'Gut bestanden!', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', text: 'Gutes Wissen, noch ein kleiner Feinschliff nötig.' };
    return { title: 'Dranbleiben!', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', text: 'Versuche es noch einmal, um deinen Score zu verbessern!' };
  };

  const grade = getGradeInfo();

  return (
    <div className="my-5 w-full rounded-3xl bg-[#141417] border border-white/10 shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans'] text-neutral-100">
      {/* Quiz Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#1c1c22] to-[#16161b] border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              {data.title || 'Interaktives Dandelious Quiz'}
            </h3>
            <p className="text-xs text-neutral-400">
              {totalQuestions} Testfragen • Wählen & Auswerten
            </p>
          </div>
        </div>

        {isSubmitted && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${grade.badge}`}>
            {score} / {totalQuestions} ({percentage}%)
          </span>
        )}
      </div>

      {/* Main Quiz Body */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Question Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {questions.map((q, idx) => {
            const isAnswered = userAnswers[idx] !== undefined;
            const isCorrect = isSubmitted && userAnswers[idx] === q.correctIndex;
            const isWrong = isSubmitted && isAnswered && userAnswers[idx] !== q.correctIndex;

            let tabStyle = 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10';
            if (activeQuestion === idx) {
              tabStyle = 'bg-blue-600 text-white font-bold border-blue-400 shadow-md';
            } else if (isSubmitted) {
              if (isCorrect) tabStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
              if (isWrong) tabStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
            } else if (isAnswered) {
              tabStyle = 'bg-white/15 text-white border-white/20';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveQuestion(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${tabStyle}`}
              >
                <span>Frage {idx + 1}</span>
                {isSubmitted && (
                  isCorrect ? <Check className="w-3 h-3 text-emerald-400" /> : isWrong ? <X className="w-3 h-3 text-rose-400" /> : null
                )}
              </button>
            );
          })}
        </div>

        {/* Current Active Question Display */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Frage {activeQuestion + 1} von {totalQuestions}
            </span>
            <h4 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {questions[activeQuestion].question}
            </h4>
          </div>

          {/* Options Grid (Multiple Choice / Ankreuzen) */}
          <div className="space-y-2.5">
            {questions[activeQuestion].options.map((optionText, optIdx) => {
              const isSelected = userAnswers[activeQuestion] === optIdx;
              const isCorrectOption = questions[activeQuestion].correctIndex === optIdx;

              let optionStyle = 'bg-[#1a1a1f] border-white/10 text-neutral-200 hover:border-white/25 hover:bg-[#22222a]';
              let badgeColor = 'bg-white/10 text-neutral-400';

              if (isSubmitted) {
                if (isCorrectOption) {
                  optionStyle = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
                  badgeColor = 'bg-emerald-500 text-black font-bold';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'bg-rose-500/15 border-rose-500/50 text-rose-200';
                  badgeColor = 'bg-rose-500 text-white font-bold';
                } else {
                  optionStyle = 'bg-[#151518] border-white/5 text-neutral-500 opacity-60';
                }
              } else if (isSelected) {
                optionStyle = 'bg-blue-600/15 border-blue-500/50 text-white font-medium shadow-[0_0_15px_rgba(147,51,234,0.15)]';
                badgeColor = 'bg-blue-600 text-white font-bold';
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(activeQuestion, optIdx)}
                  disabled={isSubmitted}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 text-xs sm:text-sm ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center shrink-0 ${badgeColor}`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-snug">{optionText}</span>
                  </div>

                  {/* Right Status Icon */}
                  <div className="shrink-0">
                    {isSubmitted ? (
                      isCorrectOption ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      ) : null
                    ) : (
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-neutral-600'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isSubmitted && questions[activeQuestion].explanation && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Erklärung:</span>
              </div>
              <p className="leading-relaxed text-neutral-300">
                {questions[activeQuestion].explanation}
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer Navigation & Submit / Evaluation */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveQuestion((prev) => Math.max(0, prev - 1))}
              disabled={activeQuestion === 0}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={() => setActiveQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))}
              disabled={activeQuestion === totalQuestions - 1}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>

          <div>
            {!isSubmitted ? (
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                disabled={!isAllAnswered}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-bold transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Quiz jetzt auswerten</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-white/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Erneut versuchen</span>
              </button>
            )}
          </div>
        </div>

        {/* Result Card when submitted */}
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-3xl bg-gradient-to-br from-[#1a1a22] to-[#121216] border border-white/15 text-center space-y-3 shadow-xl"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white tracking-tight">{grade.title}</h4>
              <p className="text-xs text-neutral-300">{grade.text}</p>
            </div>

            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-sm font-bold text-white">
              <span>Testergebnis:</span>
              <span className="text-blue-400 text-base">{score} / {totalQuestions}</span>
              <span className="text-neutral-400 font-normal">({percentage}%)</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
