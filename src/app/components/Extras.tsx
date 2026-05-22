import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Gift, Star, Plus, X } from "lucide-react";
import { db } from "../../Firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

const defaultQuestions = [
  {
    question: "Qual foi o lugar do nosso primeiro encontro?",
    options: ["Café Central", "Parque da Cidade", "Cinema", "Restaurante Italiano"],
    correct: 1,
  },
  {
    question: "Qual é a nossa música favorita?",
    options: ["Perfect - Ed Sheeran", "All of Me - John Legend", "A Thousand Years", "Thinking Out Loud"],
    correct: 0,
  },
  {
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
  const [questions, setQuestions] = useState<any[]>(defaultQuestions);
  const [quizActive, setQuizActive] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

  // Estado do formulário para nova pergunta
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "quiz"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const dbQuestions = snap.docs.map(doc => doc.data());
      if (dbQuestions.length > 0) {
        setQuestions([...defaultQuestions, ...dbQuestions]);
      }
    });
    return () => unsub();
  }, []);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || newOptions.some(o => !o.trim()) || !db) return;
    
    try {
      await addDoc(collection(db, "quiz"), {
        question: newQuestion,
        options: newOptions,
        correct: correctOption,
        createdAt: new Date().toISOString(),
      });
      setNewQuestion("");
      setNewOptions(["", "", "", ""]);
      setCorrectOption(0);
      setShowAddForm(false);
    } catch (err) {
      console.error("Erro ao adicionar pergunta:", err);
    }
  };

  const handleAnswer = (index: number) => {
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion < questions.length - 1) {
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
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Surpresas e diversão para nós dois
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
            <span className="font-bold">Adicionar Pergunta ao Quiz</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setQuizActive(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Star className="w-12 h-12 mx-auto mb-3" />
            <h3 className="mb-2">Quiz do Amor</h3>
            <p className="text-sm text-white/90">
              Teste seus conhecimentos sobre nós!
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
              Pergunta {currentQuestion + 1} de {questions.length}
            </div>
            <h3 className="text-slate-900 dark:text-slate-100">
              {questions[currentQuestion].question}
            </h3>
          </div>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
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
            {score} de {questions.length}
          </p>
          <p className="text-slate-800/80 dark:text-slate-300 mb-6">
            {score === questions.length
              ? "Perfeito! Você me conhece muito bem! 💕"
              : score >= questions.length / 2
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nova Pergunta</h3>
                <button onClick={() => setShowAddForm(false)}><X size={24} className="text-slate-500" /></button>
              </div>
              <input
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Escreva a pergunta..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white mb-4 outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="space-y-2 mb-6">
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="radio"
                      checked={correctOption === i}
                      onChange={() => setCorrectOption(i)}
                      className="accent-primary w-4 h-4"
                    />
                    <input
                      value={opt}
                      onChange={e => {
                        const opts = [...newOptions];
                        opts[i] = e.target.value;
                        setNewOptions(opts);
                      }}
                      placeholder={`Opção ${i + 1}`}
                      className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddQuestion}
                className="w-full bg-primary dark:bg-pink-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 dark:shadow-pink-900/30 active:scale-95 transition-transform"
              >
                Salvar Pergunta ❤️
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
