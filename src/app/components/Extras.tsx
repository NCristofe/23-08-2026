import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Gift, Star, Plus, X, Gamepad2 } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../../Firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc } from "firebase/firestore";

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
};

type QuizSet = {
  id: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: string;
};

type QuizHistory = {
  id: string;
  quizId: string;
  quizOwner: string;
  respondent: string;
  score: number;
  total: number;
  accuracy: number;
  answeredAt: string;
};

type WordGuess = {
  id: string;
  player: string;
  target: string;
  guess: string;
  result: LetterResult[];
  createdAt: string;
};

type LetterResult = {
  letter: string;
  status: "correct" | "present" | "absent";
  correctPosition?: number;
};

type WordGame = {
  createdBy: string;
  createdAt: string;
  players: string[];
  round: number;
  status: "waiting" | "active" | "finished";
  words?: Record<string, string>;
  guesses?: WordGuess[];
};

type WordGameHistory = {
  id: string;
  round: number;
  players: string[];
  words: Record<string, string>;
  guesses: WordGuess[];
  startedAt: string;
  finishedAt: string;
};

const users = ["Geovanna", "Natanael"];
const WORD_GAME_ID = "geovanna-natanael";

const surprises = [
  "💕 Você é a razão do meu sorriso todos os dias!",
  "✨ Obrigado por tornar minha vida mais bonita!",
  "🌟 Cada momento com você é um presente!",
  "💖 Você é meu mundo inteiro!",
  "🎁 Te amo mais a cada dia que passa!",
  "🌹 Você faz tudo valer a pena!",
];

export default function Extras() {
  const currentUser = localStorage.getItem("currentUser") ?? "Anônimo";
  const partnerName = users.find((user) => user !== currentUser) ?? "seu amor";

  const [availableQuizzes, setAvailableQuizzes] = useState<QuizSet[]>([]);
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [wordGame, setWordGame] = useState<WordGame | null>(null);
  const [wordGameHistory, setWordGameHistory] = useState<WordGameHistory[]>([]);
  const [secretWord, setSecretWord] = useState("");
  const [guessWord, setGuessWord] = useState("");
  const [wordGameError, setWordGameError] = useState("");
  const [isStartingWordRound, setIsStartingWordRound] = useState(false);
  const [isSavingSecretWord, setIsSavingSecretWord] = useState(false);

  // Estado do formulário para nova pergunta
  const emptyQuizDraft = () =>
    Array.from({ length: 4 }, () => ({
      question: "",
      options: ["", "", "", ""],
      correct: 0,
    }));

  const [newQuestions, setNewQuestions] = useState<QuizQuestion[]>(emptyQuizDraft);
  const hasWordRoom = Boolean(wordGame);
  const isWordRoundActive = wordGame?.status === "active";
  const partnerSecret = wordGame?.words?.[partnerName];
  const currentUserSecret = wordGame?.words?.[currentUser];
  const wordGuesses = (wordGame?.guesses ?? []).filter(
    (guess) => guess.player === currentUser || guess.target === currentUser
  );

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "quiz"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const dbQuizzes = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }) as QuizSet)
        .filter((quiz) => (
          quiz.createdBy &&
          quiz.createdBy !== currentUser &&
          Array.isArray(quiz.questions) &&
          quiz.questions.length === 4
        ));

      setAvailableQuizzes((currentQuizzes) => {
        const answeredIds = new Set(history.map((item) => item.quizId));
        const filtered = dbQuizzes.filter((quiz) => !answeredIds.has(quiz.id));
        return JSON.stringify(currentQuizzes) === JSON.stringify(filtered) ? currentQuizzes : filtered;
      });
    });
    return () => unsub();
  }, [currentUser, history]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "quiz_history"), orderBy("answeredAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const dbHistory = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }) as QuizHistory)
        .filter((item) => item.respondent === currentUser || item.quizOwner === currentUser);

      setHistory(dbHistory);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(doc(db, "word_games", WORD_GAME_ID), (snap) => {
      setWordGame(snap.exists() ? snap.data() as WordGame : null);
    }, (error) => {
      console.error("Erro ao carregar jogo de palavras:", error);
      setWordGameError("Nao foi possivel carregar o jogo de palavras.");
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "word_games_history"), orderBy("finishedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const dbHistory = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }) as WordGameHistory);
      setWordGameHistory(dbHistory);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  }, [activeQuiz?.id]);

  const hasInvalidQuizDraft = newQuestions.some((item) =>
    !item.question.trim() || item.options.some((option) => !option.trim())
  );

  const updateDraftQuestion = (questionIndex: number, value: string) => {
    setNewQuestions((items) => items.map((item, index) => (
      index === questionIndex ? { ...item, question: value } : item
    )));
  };

  const updateDraftOption = (questionIndex: number, optionIndex: number, value: string) => {
    setNewQuestions((items) => items.map((item, index) => {
      if (index !== questionIndex) return item;

      const options = [...item.options];
      options[optionIndex] = value;
      return { ...item, options };
    }));
  };

  const updateDraftCorrect = (questionIndex: number, correct: number) => {
    setNewQuestions((items) => items.map((item, index) => (
      index === questionIndex ? { ...item, correct } : item
    )));
  };

  const handleAddQuiz = async () => {
    if (hasInvalidQuizDraft || !db) return;
    
    try {
      await addDoc(collection(db, "quiz"), {
        questions: newQuestions.map((item) => ({
          question: item.question.trim(),
          options: item.options.map((option) => option.trim()),
          correct: item.correct,
        })),
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
      });
      setNewQuestions(emptyQuizDraft());
      setShowAddForm(false);
    } catch (err) {
      console.error("Erro ao adicionar quiz:", err);
    }
  };

  const startQuiz = () => {
    const quiz = availableQuizzes[0];
    if (!quiz) return;

    setActiveQuiz(quiz);
    setQuizActive(true);
  };

  const handleAnswer = async (index: number) => {
    if (!activeQuiz?.questions[currentQuestion]) return;

    const nextScore = index === activeQuiz.questions[currentQuestion].correct ? score + 1 : score;

    if (currentQuestion < activeQuiz.questions.length - 1) {
      setScore(nextScore);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setScore(nextScore);
      setShowResult(true);

      if (db) {
        const total = activeQuiz.questions.length;
        await addDoc(collection(db, "quiz_history"), {
          quizId: activeQuiz.id,
          quizOwner: activeQuiz.createdBy,
          respondent: currentUser,
          score: nextScore,
          total,
          accuracy: Math.round((nextScore / total) * 100),
          answeredAt: new Date().toISOString(),
        });
      }
    }
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setActiveQuiz(null);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  };

  const normalizeWord = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 4);

  const getWordResult = (guess: string, target: string): LetterResult[] =>
    guess.split("").map((letter, index) => {
      if (letter === target[index]) {
        return { letter, status: "correct" };
      }

      const correctPosition = target.indexOf(letter);
      if (correctPosition >= 0) {
        return { letter, status: "present", correctPosition };
      }

      return { letter, status: "absent" };
    });

  const startWordRound = async () => {
    if (!db) {
      setWordGameError("Firebase nao configurado.");
      return;
    }

    try {
      setIsStartingWordRound(true);
      setWordGameError("");
      await setDoc(doc(db, "word_games", WORD_GAME_ID), {
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
        players: users,
        status: "active",
        round: (wordGame?.round ?? 0) + 1,
        words: {},
        guesses: [],
      }, { merge: true });
      setSecretWord("");
      setGuessWord("");
    } catch (error) {
      console.error("Erro ao iniciar partida:", error);
      const firebaseError = error as { code?: string };
      setWordGameError(
        firebaseError.code === "permission-denied"
          ? "Permissao negada. Publique as regras do Firestore liberando word_games."
          : "Nao foi possivel criar a sala."
      );
    } finally {
      setIsStartingWordRound(false);
    }
  };

  const saveSecretWord = async () => {
    const word = normalizeWord(secretWord);
    if (!db) {
      setWordGameError("Firebase nao configurado.");
      return;
    }

    if (word.length !== 4) {
      setWordGameError("A palavra precisa ter exatamente 4 letras.");
      return;
    }

    try {
      setIsSavingSecretWord(true);
      setWordGameError("");
      await setDoc(doc(db, "word_games", WORD_GAME_ID), {
        createdBy: wordGame?.createdBy ?? currentUser,
        createdAt: wordGame?.createdAt ?? new Date().toISOString(),
        players: users,
        status: "active",
        round: isWordRoundActive ? wordGame?.round ?? 1 : (wordGame?.round ?? 0) + 1,
        words: {
          ...(wordGame?.words ?? {}),
          [currentUser]: word,
        },
        guesses: isWordRoundActive ? wordGame?.guesses ?? [] : [],
      }, { merge: true });
      setSecretWord("");
      toast.success("Sua palavra foi salva!");
    } catch (error) {
      console.error("Erro ao salvar palavra:", error);
      const firebaseError = error as { code?: string };
      setWordGameError(
        firebaseError.code === "permission-denied"
          ? "Permissao negada. Publique as regras do Firestore liberando word_games."
          : "Nao foi possivel salvar sua palavra."
      );
    } finally {
      setIsSavingSecretWord(false);
    }
  };

  const submitWordGuess = async () => {
    const guess = normalizeWord(guessWord);
    if (!db || !isWordRoundActive) {
      setWordGameError("Inicie uma partida antes de jogar.");
      return;
    }

    if (guess.length !== 4) {
      setWordGameError("Seu palpite precisa ter exatamente 4 letras.");
      return;
    }

    if (!partnerSecret) {
      setWordGameError(`${partnerName} ainda nao cadastrou uma palavra.`);
      return;
    }

    const newGuess: WordGuess = {
      id: `${Date.now()}-${currentUser}`,
      player: currentUser,
      target: partnerName,
      guess,
      result: getWordResult(guess, partnerSecret),
      createdAt: new Date().toISOString(),
    };

    try {
      setWordGameError("");
      await setDoc(doc(db, "word_games", WORD_GAME_ID), {
        guesses: [...(wordGame?.guesses ?? []), newGuess],
      }, { merge: true });
      setGuessWord("");
    } catch (error) {
      console.error("Erro ao enviar palpite:", error);
      setWordGameError("Nao foi possivel enviar seu palpite.");
    }
  };

  const finishWordRound = async () => {
    if (!db || !wordGame) return;

    try {
      // Salvar no histórico
      await addDoc(collection(db, "word_games_history"), {
        round: wordGame.round,
        players: wordGame.players,
        words: wordGame.words ?? {},
        guesses: wordGame.guesses ?? [],
        startedAt: wordGame.createdAt,
        finishedAt: new Date().toISOString(),
      });
      
      // Atualizar status da partida
      await setDoc(doc(db, "word_games", WORD_GAME_ID), {
        status: "finished",
      }, { merge: true });
      
      toast.success("Partida encerrada e salva no histórico!");
    } catch (error) {
      console.error("Erro ao encerrar partida:", error);
      toast.error("Erro ao encerrar partida");
    }
  };

  const showSurprise = () => {
    const randomSurprise = surprises[Math.floor(Math.random() * surprises.length)];
    setSurprise(randomSurprise);

    // Create floating hearts
    const newHearts = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
    }));
    setHearts(newHearts);

    setTimeout(() => {
      setHearts([]);
    }, 3000);

    setTimeout(() => {
      setSurprise(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen w-full p-6 pt-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-romantic text-5xl text-primary mb-1">
          Jogos e Surpresas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Quizzes, desafios e pequenos momentos para nós dois
        </p>
      </motion.div>

      {!quizActive && !showResult ? (
        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowAddForm(true)}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-4 shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus size={20} className="text-primary" />
            <span className="font-bold">Criar quiz com 4 perguntas para {partnerName}</span>
          </motion.button>

          {availableQuizzes.length > 0 ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={startQuiz}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Star className="w-12 h-12 mx-auto mb-3" />
              <h3 className="mb-2">Quiz de {partnerName}</h3>
              <p className="text-sm text-white/90">
                {availableQuizzes.length} quiz disponível para responder.
              </p>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <Star className="w-10 h-10 mx-auto mb-3 text-primary" />
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Nenhum quiz de {partnerName} ainda
              </p>
              <p className="mt-1 text-sm">
                Quando {partnerName} criar perguntas, elas aparecem aqui para você responder.
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl bg-white p-5 shadow-md dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Gamepad2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Adivinhe a Palavra
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Palavras secretas de 4 letras
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Sala da partida
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isWordRoundActive
                        ? `Partida ${wordGame?.round ?? 1} em andamento`
                        : hasWordRoom
                        ? "Partida encerrada. Inicie uma nova quando quiser"
                        : "Inicie uma partida para jogar"}
                    </p>
                  </div>
                  {isWordRoundActive ? (
                    <button
                      onClick={finishWordRound}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 active:scale-95 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    >
                      Encerrar
                    </button>
                  ) : (
                    <button
                      onClick={startWordRound}
                      disabled={isStartingWordRound}
                      className="rounded-xl bg-pink-500 px-3 py-2 text-sm font-bold text-white shadow-md shadow-pink-500/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-pink-300"
                    >
                      {isStartingWordRound ? "Criando..." : "Criar sala"}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Sua palavra
                  </p>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {currentUserSecret ? "Cadastrada" : "Pendente"}
                  </span>
                </div>
                {currentUserSecret && (
                  <p className="mb-3 rounded-xl bg-primary/10 p-3 text-center font-black uppercase tracking-[0.4em] text-primary">
                    {currentUserSecret}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    value={secretWord}
                    onChange={(event) => setSecretWord(normalizeWord(event.target.value))}
                    placeholder="AMOR"
                    maxLength={4}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-center uppercase tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={saveSecretWord}
                    disabled={isSavingSecretWord}
                    className="rounded-xl bg-pink-500 px-4 py-3 font-bold text-white shadow-md shadow-pink-500/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-pink-300"
                  >
                    {isSavingSecretWord ? "Salvando..." : "Salvar"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Digite 4 letras. Se nao houver sala, ela sera criada automaticamente.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Palavra de {partnerName}
                  </p>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {partnerSecret ? "Pronta" : "Aguardando"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={guessWord}
                    onChange={(event) => setGuessWord(normalizeWord(event.target.value))}
                    placeholder="LUAU"
                    maxLength={4}
                    disabled={!isWordRoundActive || !partnerSecret}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-center uppercase tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={submitWordGuess}
                    disabled={!isWordRoundActive || !partnerSecret}
                    className="rounded-xl bg-slate-900 px-4 py-3 font-bold text-white shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700"
                  >
                    Tentar
                  </button>
                </div>
              </div>

              {wordGameError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  {wordGameError}
                </p>
              )}

              {wordGuesses.length > 0 && (
                <div className="space-y-3">
                  {wordGuesses.slice().reverse().map((guess) => (
                    <div
                      key={guess.id}
                      className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{guess.player} tentou adivinhar {guess.target}</span>
                        <span>{guess.guess === wordGame?.words?.[guess.target] ? "Acertou" : "Tentativa"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {guess.result.map((item, index) => (
                          <div
                            key={`${guess.id}-${index}`}
                            className={`flex aspect-square flex-col items-center justify-center rounded-xl text-base font-black text-white ${
                              item.status === "correct"
                                ? "bg-emerald-500"
                                : item.status === "present"
                                ? "bg-amber-500"
                                : "bg-slate-400 dark:bg-slate-700"
                            }`}
                          >
                            <span>{item.letter}</span>
                            {item.status === "present" && item.correctPosition !== undefined && (
                              <span className="text-[10px] font-bold leading-none">
                                pos {item.correctPosition + 1}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={showSurprise}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
          >
            <Gift className="w-12 h-12 mx-auto mb-3" />
            <h3 className="mb-2">Surpresa do Dia</h3>
            <p className="text-sm text-white/90">
              Clique para uma mensagem especial!
            </p>
          </motion.button>

          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-3xl bg-white p-5 shadow-md dark:bg-slate-900"
            >
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Histórico de quizzes
              </h3>
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.respondent} respondeu
                      </span>
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
                        {item.accuracy}%
                      </span>
                    </div>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                      {item.score} de {item.total} acertos no quiz de {item.quizOwner}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {wordGameHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="rounded-3xl bg-white p-5 shadow-md dark:bg-slate-900"
            >
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Histórico de partidas (Adivinhe a Palavra)
              </h3>
              <div className="space-y-3">
                {wordGameHistory.map((item) => {
                  const totalGuesses = item.guesses.length;
                  const correctGuesses = item.guesses.filter(
                    (guess) => guess.guess === item.words[guess.target]
                  ).length;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          Partida {item.round}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {correctGuesses}/{totalGuesses}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Jogadores: {item.players.join(" vs ")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {new Date(item.finishedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/20 dark:to-purple-950/20 rounded-3xl p-8 text-center border border-transparent dark:border-pink-900/20"
          >
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-slate-800/80 dark:text-slate-300 font-romantic text-xl">
              Obrigado por fazer parte da minha vida 💕
            </p>
          </motion.div>
        </div>
      ) : quizActive && !showResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg transition-colors"
        >
          <div className="text-center mb-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Pergunta {currentQuestion + 1} de {activeQuiz?.questions.length ?? 0}
            </div>
            <h3 className="text-slate-900 dark:text-slate-100">
              {activeQuiz?.questions[currentQuestion]?.question}
            </h3>
          </div>

          <div className="space-y-3">
            {activeQuiz?.questions[currentQuestion]?.options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(index)}
                className="w-full bg-secondary dark:bg-slate-800 hover:bg-primary hover:text-white text-foreground dark:text-slate-200 rounded-full py-4 px-6 transition-all duration-300 hover:scale-105"
              >
                {option}
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg text-center transition-colors"
        >
          <Heart className="w-16 h-16 text-primary fill-current mx-auto mb-4" />
          <h2 className="font-romantic text-4xl text-primary mb-4">
            Resultado!
          </h2>
          <p className="text-3xl mb-6 dark:text-slate-100">
            {score} de {activeQuiz?.questions.length ?? 0}
          </p>
          <p className="text-slate-800/80 dark:text-slate-300 mb-6">
            {score === activeQuiz?.questions.length
              ? "Perfeito! Você me conhece muito bem! 💕"
              : score >= (activeQuiz?.questions.length ?? 0) / 2
              ? "Muito bem! Nosso amor é forte! ❤️"
              : "Vamos criar mais memórias juntos! 🥰"}
          </p>
          <button
            onClick={resetQuiz}
            className="bg-primary text-white rounded-full py-3 px-8 hover:bg-primary/90 transition-colors duration-300"
          >
            Voltar
          </button>
        </motion.div>
      )}

      {/* Modal de Adicionar Pergunta */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Novo Quiz</h3>
                <button onClick={() => setShowAddForm(false)}><X size={24} className="text-slate-500" /></button>
              </div>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
                {newQuestions.map((item, questionIndex) => (
                  <div key={questionIndex} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      Pergunta {questionIndex + 1}
                    </p>
                    <input
                      value={item.question}
                      onChange={(event) => updateDraftQuestion(questionIndex, event.target.value)}
                      placeholder="Escreva a pergunta..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white mb-3 outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="space-y-2">
                      {item.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            checked={item.correct === optionIndex}
                            onChange={() => updateDraftCorrect(questionIndex, optionIndex)}
                            className="accent-primary w-4 h-4"
                          />
                          <input
                            value={option}
                            onChange={(event) => updateDraftOption(questionIndex, optionIndex, event.target.value)}
                            placeholder={`Opção ${optionIndex + 1}`}
                            className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddQuiz}
                disabled={hasInvalidQuizDraft}
                className="mt-5 w-full bg-primary dark:bg-pink-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 dark:shadow-pink-900/30 active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-60"
              >
                Salvar Quiz ❤️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surprise modal */}
      <AnimatePresence>
        {surprise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm shadow-2xl text-center relative transition-colors"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>
              <p className="text-slate-900 dark:text-slate-100 font-romantic text-2xl">
                {surprise}
              </p>
            </motion.div>

            {/* Floating hearts */}
            {hearts.map((heart) => (
              <motion.div
                key={heart.id}
                initial={{ y: "100vh", x: `${heart.x}vw`, opacity: 1 }}
                animate={{ y: "-20vh", opacity: 0 }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="absolute"
                style={{ left: 0, bottom: 0 }}
              >
                <Heart className="w-8 h-8 text-primary fill-current" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
