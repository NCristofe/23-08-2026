import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Gift, Star, Plus, X, Gamepad2 } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../../Firebase";
import { 
  collection, addDoc, onSnapshot, query, orderBy, doc, 
  setDoc, updateDoc, arrayUnion, 
  QuerySnapshot, 
  DocumentData, 
  DocumentSnapshot 
} from "firebase/firestore";

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
  letterCount: number;
  words?: Record<string, string>;
  guesses?: WordGuess[];
  winners?: string[];
};

type WordGameHistory = {
  id: string;
  round: number;
  players: string[];
  letterCount: number;
  words: Record<string, string>;
  guesses: WordGuess[];
  winners: string[];
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

  const [activeGame, setActiveGame] = useState<"quiz" | "word" | null>(null);
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
  const [letterCountDraft, setLetterCountDraft] = useState(4);
  const [winCelebration, setWinCelebration] = useState<{ winner: string; word: string } | null>(null);
  const celebratedGuessIds = useRef<Set<string>>(new Set());

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
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const dbQuizzes = snap.docs
        .map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }) as QuizSet)
        .filter((quiz: QuizSet) => (
          quiz.createdBy &&
          quiz.createdBy !== currentUser &&
          Array.isArray(quiz.questions) &&
          quiz.questions.length === 4
        ));

      setAvailableQuizzes((currentQuizzes) => {
        const answeredIds = new Set(history.map((item) => item.quizId));
        const filtered = dbQuizzes.filter((quiz: QuizSet) => !answeredIds.has(quiz.id));
        return JSON.stringify(currentQuizzes) === JSON.stringify(filtered) ? currentQuizzes : filtered;
      });
    });
    return () => unsub();
  }, [currentUser, history]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "quiz_history"), orderBy("answeredAt", "desc"));
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const dbHistory = snap.docs
        .map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }) as QuizHistory)
        .filter((item: QuizHistory) => item.respondent === currentUser || item.quizOwner === currentUser);

      setHistory(dbHistory);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(doc(db, "word_games", WORD_GAME_ID), (snap: DocumentSnapshot<DocumentData>) => {
      setWordGame(snap.exists() ? snap.data() as WordGame : null);
    }, (error: any) => {
      console.error("Erro ao carregar jogo de palavras:", error);
      setWordGameError("Nao foi possivel carregar o jogo de palavras.");
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "word_games_history"), orderBy("finishedAt", "desc"));
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const dbHistory = snap.docs
        .map((doc: any) => ({
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

  // Detecta acertos em tempo real para ambos os jogadores
  useEffect(() => {
    if (!wordGame?.guesses || !wordGame.words) return;
    for (const guess of wordGame.guesses) {
      if (celebratedGuessIds.current.has(guess.id)) continue;
      if (guess.guess === wordGame.words[guess.target]) {
        celebratedGuessIds.current.add(guess.id);
        setWinCelebration({ winner: guess.player, word: guess.guess });
        setTimeout(() => setWinCelebration(null), 5000);
        break;
      }
    }
  }, [wordGame?.guesses]);

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

  const activeLetterCount = wordGame?.letterCount ?? letterCountDraft;

  const normalizeWord = (value: string, length = activeLetterCount) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, length);

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
      setWordGameError("Firebase não configurado.");
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
        letterCount: letterCountDraft,
        words: {},
        guesses: [],
        winners: [],
      });
      setSecretWord("");
      setGuessWord("");
    } catch (error) {
      console.error("Erro ao iniciar partida:", error);
      const firebaseError = error as { code?: string };
      setWordGameError(
        firebaseError.code === "permission-denied"
          ? "Permissão negada. Publique as regras do Firestore."
          : "Não foi possível criar a sala."
      );
    } finally {
      setIsStartingWordRound(false);
    }
  };

  const saveSecretWord = async () => {
    const word = normalizeWord(secretWord, activeLetterCount);
    if (!db) {
      setWordGameError("Firebase não configurado.");
      return;
    }

    if (word.length !== activeLetterCount) {
      setWordGameError(`A palavra precisa ter exatamente ${activeLetterCount} letras.`);
      return;
    }

    try {
      setIsSavingSecretWord(true);
      setWordGameError("");

      const gameRef = doc(db, "word_games", WORD_GAME_ID);
      await setDoc(gameRef, {
        [`words.${currentUser}`]: word,
        status: "active",
      }, { merge: true });

      setSecretWord("");
      toast.success("Sua palavra foi salva! ❤️");
    } catch (error) {
      console.error("Erro ao salvar palavra:", error);
      const firebaseError = error as { code?: string };
      setWordGameError(
        firebaseError.code === "permission-denied"
          ? "Permissão negada no Firestore."
          : "Não foi possível salvar sua palavra."
      );
    } finally {
      setIsSavingSecretWord(false);
    }
  };

  const submitWordGuess = async () => {
    const guess = normalizeWord(guessWord, activeLetterCount);
    if (!db || !isWordRoundActive) {
      setWordGameError("Inicie uma partida antes de jogar.");
      return;
    }

    if (guess.length !== activeLetterCount) {
      setWordGameError(`Seu palpite precisa ter exatamente ${activeLetterCount} letras.`);
      return;
    }

    if (!partnerSecret) {
      setWordGameError(`${partnerName} ainda nao cadastrou uma palavra.`);
      return;
    }

    const isCorrect = guess === partnerSecret;
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
      const updates: Record<string, any> = { guesses: arrayUnion(newGuess) };
      if (isCorrect) updates.winners = arrayUnion(currentUser);
      await updateDoc(doc(db, "word_games", WORD_GAME_ID), updates);
      setGuessWord("");
    } catch (error) {
      console.error("Erro ao enviar palpite:", error);
      setWordGameError("Não foi possível enviar seu palpite.");
    }
  };

  const finishWordRound = async () => {
    if (!db || !wordGame) return;

    const winners = wordGame.winners ?? [];
    try {
      await addDoc(collection(db, "word_games_history"), {
        round: wordGame.round,
        players: wordGame.players,
        letterCount: wordGame.letterCount ?? 4,
        words: wordGame.words ?? {},
        guesses: wordGame.guesses ?? [],
        winners,
        startedAt: wordGame.createdAt,
        finishedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "word_games", WORD_GAME_ID), { status: "finished", guesses: [] }, { merge: true });
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

  const backToList = () => {
    setActiveGame(null);
    setQuizActive(false);
    setActiveQuiz(null);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  };

  // ── GAMES LOBBY ────────────────────────────────────────────
  if (activeGame === null) {
    return (
      <div className="min-h-screen w-full p-6 pt-8 pb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-romantic text-5xl text-primary mb-1">Jogos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Escolha um jogo para jogar juntos
          </p>
        </motion.div>

        <div className="space-y-4">
          {/* Quiz */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setActiveGame("quiz")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Star className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-0.5">Quiz do Casal</h3>
                <p className="text-sm text-white/80">
                  Crie perguntas e descubra o quanto se conhecem
                </p>
                {availableQuizzes.length > 0 && (
                  <span className="mt-2 inline-block bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold">
                    {availableQuizzes.length} quiz disponível ✨
                  </span>
                )}
              </div>
            </div>
          </motion.button>

          {/* Adivinhe a Palavra */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setActiveGame("word")}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-0.5">Adivinhe a Palavra</h3>
                <p className="text-sm text-white/80">
                  Descubra a palavra secreta de 4 letras do seu amor
                </p>
                {isWordRoundActive && (
                  <span className="mt-2 inline-block bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold">
                    Partida em andamento 🟢
                  </span>
                )}
              </div>
            </div>
          </motion.button>

          {/* Surpresa do Dia */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={showSurprise}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-0.5">Surpresa do Dia</h3>
                <p className="text-sm text-white/80">
                  Toque para receber uma mensagem especial
                </p>
              </div>
            </div>
          </motion.button>

          {/* Rodapé romântico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/20 dark:to-purple-950/20 rounded-3xl p-6 text-center border border-transparent dark:border-pink-900/20"
          >
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-slate-800/80 dark:text-slate-300 font-romantic text-xl">
              Obrigado por fazer parte da minha vida 💕
            </p>
          </motion.div>
        </div>

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

  // ── QUIZ ───────────────────────────────────────────────────
  if (activeGame === "quiz") {
    return (
      <div className="min-h-screen w-full p-6 pt-8 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={backToList}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">Quiz do Casal</h2>
        </div>

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

          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-white p-5 shadow-md dark:bg-slate-900"
            >
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Histórico</h3>
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
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

    </div>
  );
  }

  // ── JOGO DE PALAVRAS ───────────────────────────────────────
  // Placar geral calculado a partir do histórico
  const scoreboard = users.reduce((acc, player) => {
    acc[player] = { wins: 0, losses: 0 };
    return acc;
  }, {} as Record<string, { wins: number; losses: number }>);
  wordGameHistory.forEach((game) => {
    const gameWinners = game.winners ?? [];
    users.forEach((player) => {
      if (gameWinners.includes(player)) scoreboard[player].wins++;
      else scoreboard[player].losses++;
    });
  });

  return (
    <div className="min-h-screen w-full p-6 pt-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={backToList}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">Adivinhe a Palavra</h2>
      </div>

      <div className="space-y-4">
        {/* Placar */}
        {wordGameHistory.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Placar</p>
            <div className="grid grid-cols-2 gap-3">
              {users.map((player) => (
                <div key={player} className={`rounded-xl p-3 text-center ${player === currentUser ? "bg-primary/10" : "bg-slate-50 dark:bg-slate-800"}`}>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{player}</p>
                  <p className="text-2xl font-black text-emerald-500 mt-1">{scoreboard[player]?.wins ?? 0}V</p>
                  <p className="text-xs text-slate-400">{scoreboard[player]?.losses ?? 0} derrotas</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sala da partida */}
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-white dark:bg-slate-900">
          {!isWordRoundActive ? (
            <>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Nova partida</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {hasWordRoom ? "Partida encerrada. Configure e inicie uma nova." : "Configure e inicie uma partida."}
              </p>

              {/* Seletor de letras */}
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Quantidade de letras</p>
              <div className="flex gap-2 mb-4">
                {[3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setLetterCountDraft(n)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                      letterCountDraft === n
                        ? "bg-primary text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={startWordRound}
                disabled={isStartingWordRound}
                className="w-full rounded-xl bg-pink-500 py-3 font-bold text-white shadow-md shadow-pink-500/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-pink-300"
              >
                {isStartingWordRound ? "Criando..." : "Criar sala"}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Partida {wordGame?.round} · {activeLetterCount} letras
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Em andamento</p>
              </div>
              {wordGame?.createdBy === currentUser && (
                <button
                  onClick={finishWordRound}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 active:scale-95 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  Encerrar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Minha palavra secreta */}
        {isWordRoundActive && (
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Minha palavra secreta</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentUserSecret ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                {currentUserSecret ? "Salva ✓" : "Pendente"}
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
                onChange={(e) => setSecretWord(normalizeWord(e.target.value, activeLetterCount))}
                placeholder={"A".repeat(activeLetterCount)}
                maxLength={activeLetterCount}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-center uppercase tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={saveSecretWord}
                disabled={isSavingSecretWord}
                className="rounded-xl bg-pink-500 px-4 py-3 font-bold text-white shadow-md shadow-pink-500/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-pink-300"
              >
                {isSavingSecretWord ? "..." : "Salvar"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Digite exatamente {activeLetterCount} letras.</p>
          </div>
        )}

        {/* Tentar adivinhar */}
        {isWordRoundActive && (
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Palavra de {partnerName}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${partnerSecret ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                {partnerSecret ? "Pronta" : "Aguardando..."}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={guessWord}
                onChange={(e) => setGuessWord(normalizeWord(e.target.value, activeLetterCount))}
                placeholder={"?".repeat(activeLetterCount)}
                maxLength={activeLetterCount}
                disabled={!partnerSecret}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-center uppercase tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-800 dark:bg-slate-800 dark:text-white disabled:opacity-50"
              />
              <button
                onClick={submitWordGuess}
                disabled={!partnerSecret}
                className="rounded-xl bg-emerald-500 px-4 py-3 font-bold text-white shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tentar
              </button>
            </div>
          </div>
        )}

        {wordGameError && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {wordGameError}
          </p>
        )}

        {/* Tentativas */}
        {isWordRoundActive && wordGuesses.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tentativas</p>
            {wordGuesses.slice().reverse().map((guess) => {
              const isHit = guess.guess === wordGame?.words?.[guess.target];
              return (
                <div key={guess.id} className={`rounded-2xl p-3 border ${isHit ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{guess.player === currentUser ? "Você" : guess.player} → {guess.target}</span>
                    <span className={isHit ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>{isHit ? "🎉 Acertou!" : "Tentativa"}</span>
                  </div>
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${guess.result.length}, 1fr)` }}>
                    {guess.result.map((item, index) => (
                      <div
                        key={`${guess.id}-${index}`}
                        className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-black text-white ${
                          item.status === "correct" ? "bg-emerald-500" : item.status === "present" ? "bg-amber-500" : "bg-slate-400 dark:bg-slate-600"
                        }`}
                      >
                        <span>{item.letter}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Histórico de partidas */}
        {wordGameHistory.length > 0 && (
          <div className="rounded-3xl bg-white p-5 shadow-md dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Histórico de partidas</p>
            <div className="space-y-3">
              {wordGameHistory.map((item) => {
                const gameWinners = item.winners ?? [];
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Partida {item.round} · {item.letterCount ?? 4} letras
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.finishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {users.map((player) => {
                        const won = gameWinners.includes(player);
                        return (
                          <span key={player} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${won ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                            {player}: {won ? "Vitória 🏆" : "Derrota"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de celebração de vitória */}
      <AnimatePresence>
        {winCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-6 pb-12"
            onClick={() => setWinCelebration(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 3 }}
                className="text-5xl mb-4"
              >
                🎉
              </motion.div>
              <h3 className="font-bold text-2xl text-slate-900 dark:text-slate-100 mb-2">
                {winCelebration.winner === currentUser ? "Você acertou!" : `${winCelebration.winner} acertou!`}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-1">
                {winCelebration.winner === currentUser
                  ? `Você descobriu a palavra de ${partnerName}!`
                  : `${winCelebration.winner} descobriu a sua palavra!`}
              </p>
              <p className="text-2xl font-black uppercase tracking-widest text-primary mt-3">
                {winCelebration.word}
              </p>
              <button
                onClick={() => setWinCelebration(null)}
                className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-bold"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
