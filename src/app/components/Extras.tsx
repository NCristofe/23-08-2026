import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Gift, Star, Plus, X } from "lucide-react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../Firebase";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  createdAt?: string;
};

const defaultQuizQuestions: QuizQuestion[] = [
  {
    id: "default-first-date",
    question: "Qual foi o lugar do nosso primeiro encontro?",
    options: ["Café Central", "Parque da Cidade", "Cinema", "Restaurante Italiano"],
    correct: 1,
  },
  {
    id: "default-song",
    question: "Qual é a nossa música favorita?",
    options: ["Perfect - Ed Sheeran", "All of Me - John Legend", "A Thousand Years", "Thinking Out Loud"],
    correct: 0,
  },
  {
    id: "default-gift",
    question: "Qual foi o primeiro presente que você me deu?",
    options: ["Flores", "Chocolates", "Um livro", "Uma carta"],
    correct: 3,
  },
];

const surprises = [
  "💕 Você é a razão do meu sorriso todos os dias!",
  "✨ Obrigado por tornar minha vida mais bonita!",
  "🌟 Cada momento com você é um presente!",
  "💖 Você é meu mundo inteiro!",
  "🎁 Te amo mais a cada dia que passa!",
  "🌹 Você faz tudo valer a pena!",
];

export default function Extras() {
  const [createdQuestions, setCreatedQuestions] = useState<QuizQuestion[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [formError, setFormError] = useState("");
  const [savingQuestion, setSavingQuestion] = useState(false);

  const quizQuestions = useMemo(
    () => [...defaultQuizQuestions, ...createdQuestions],
    [createdQuestions]
  );

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "loveQuizQuestions"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          question: data.question ?? "",
          options: Array.isArray(data.options) ? data.options : [],
          correct: Number(data.correct ?? 0),
          createdAt: data.createdAt,
        };
      });

      setCreatedQuestions(
        questions.filter(
          (item) =>
            item.question &&
            item.options.length === 4 &&
            item.options.every(Boolean) &&
            item.correct >= 0 &&
            item.correct <= 3
        )
      );
    });

    return () => unsubscribe();
  }, []);

  const handleAnswer = (index: number) => {
    if (index === quizQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  };

  const startQuiz = () => {
    setCreatingQuiz(false);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setQuizActive(true);
  };

  const openCreateQuiz = () => {
    setQuizActive(false);
    setShowResult(false);
    setCreatingQuiz(true);
  };

  const updateOption = (index: number, value: string) => {
    setNewOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? value : option))
    );
  };

  const resetCreateForm = () => {
    setNewQuestion("");
    setNewOptions(["", "", "", ""]);
    setCorrectOption(0);
    setFormError("");
  };

  const handleCreateQuestion = async () => {
    const question = newQuestion.trim();
    const options = newOptions.map((option) => option.trim());

    if (!question || options.some((option) => !option)) {
      setFormError("Preencha a pergunta e as quatro alternativas.");
      return;
    }

    if (!db) {
      setFormError("Firebase não configurado para salvar novas perguntas.");
      return;
    }

    try {
      setSavingQuestion(true);
      setFormError("");

      await addDoc(collection(db, "loveQuizQuestions"), {
        question,
        options,
        correct: correctOption,
        createdAt: new Date().toISOString(),
      });

      resetCreateForm();
      setCreatingQuiz(false);
    } catch (error) {
      console.error("Erro ao criar pergunta do quiz:", error);
      setFormError("Não consegui salvar agora. Tente de novo em instantes.");
    } finally {
      setSavingQuestion(false);
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
          Extras Especiais
        </h1>
        <p className="text-muted-foreground text-sm">
          Surpresas e diversão para nós dois
        </p>
      </motion.div>

      {!quizActive && !showResult && !creatingQuiz ? (
        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Star className="w-12 h-12 mx-auto mb-3" />
            <h3 className="mb-2">Quiz do Amor</h3>
            <p className="text-sm text-white/90">
              Teste seus conhecimentos sobre nós! {quizQuestions.length} perguntas
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={openCreateQuiz}
            className="w-full bg-white text-foreground rounded-3xl p-6 shadow-lg border border-pink-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="mb-2">Criar pergunta</h3>
            <p className="text-sm text-muted-foreground">
              Adicione novas memórias ao Quiz do Amor
            </p>
          </motion.button>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl p-8 text-center"
          >
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground/80 font-romantic text-xl">
              Obrigado por fazer parte da minha vida 💕
            </p>
          </motion.div>
        </div>
      ) : creatingQuiz ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-romantic text-4xl text-primary">
                Criar pergunta
              </h2>
              <p className="text-sm text-muted-foreground">
                Monte uma pergunta com quatro alternativas.
              </p>
            </div>

            <button
              onClick={() => {
                resetCreateForm();
                setCreatingQuiz(false);
              }}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
              aria-label="Fechar criação de pergunta"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Pergunta
              </label>
              <textarea
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="Ex: Onde foi nosso primeiro beijo?"
                className="w-full min-h-24 rounded-2xl border border-pink-100 bg-pink-50/40 px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Alternativas
              </p>

              {newOptions.map((option, index) => (
                <div key={index} className="flex gap-3">
                  <button
                    onClick={() => setCorrectOption(index)}
                    className={`w-11 h-11 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                      correctOption === index
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-foreground border-pink-100"
                    }`}
                    aria-label={`Marcar alternativa ${index + 1} como correta`}
                  >
                    {index + 1}
                  </button>
                  <input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Alternativa ${index + 1}`}
                    className="min-w-0 flex-1 rounded-full border border-pink-100 bg-pink-50/40 px-4 py-3 outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>

            {formError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreateQuestion}
                disabled={savingQuestion}
                className="flex-1 bg-primary text-white rounded-full py-3 px-5 hover:bg-primary/90 disabled:opacity-60 transition-colors duration-300"
              >
                {savingQuestion ? "Salvando..." : "Salvar pergunta"}
              </button>

              <button
                onClick={resetCreateForm}
                className="bg-secondary text-foreground rounded-full py-3 px-5 hover:bg-secondary/80 transition-colors duration-300"
              >
                Limpar
              </button>
            </div>
          </div>
        </motion.div>
      ) : quizActive && !showResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-lg"
        >
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">
              Pergunta {currentQuestion + 1} de {quizQuestions.length}
            </div>
            <h3 className="text-foreground">
              {quizQuestions[currentQuestion].question}
            </h3>
          </div>

          <div className="space-y-3">
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(index)}
                className="w-full bg-secondary hover:bg-primary hover:text-white text-foreground rounded-full py-4 px-6 transition-all duration-300 hover:scale-105"
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
          className="bg-white rounded-3xl p-8 shadow-lg text-center"
        >
          <Heart className="w-16 h-16 text-primary fill-current mx-auto mb-4" />
          <h2 className="font-romantic text-4xl text-primary mb-4">
            Resultado!
          </h2>
          <p className="text-3xl mb-6">
            {score} de {quizQuestions.length}
          </p>
          <p className="text-foreground/80 mb-6">
            {score === quizQuestions.length
              ? "Perfeito! Você me conhece muito bem! 💕"
              : score >= quizQuestions.length / 2
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
              className="bg-white rounded-3xl p-8 max-w-sm shadow-2xl text-center relative"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>
              <p className="text-foreground font-romantic text-2xl">
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
