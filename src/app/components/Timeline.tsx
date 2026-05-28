import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Heart, X } from "lucide-react";
import { db } from "../../Firebase";
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, orderBy, query,
} from "firebase/firestore";

type Milestone = {
  id: string;
  title: string;
  description: string;
  date: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

const EMOJIS = ["💕", "❤️", "✨", "🌟", "🎉", "🥰", "💍", "🌹", "🏖️", "🎂", "🎁", "🌙"];

function getFirebaseErrorMessage(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e.code === "permission-denied") return "Permissão negada no Firestore.";
  return `Não foi possível salvar. ${e.code || e.message || ""}`;
}

export default function Timeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState("💕");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = localStorage.getItem("currentUser") ?? "Anônimo";

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "milestones"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMilestones(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Milestone[]
      );
    }, (err) => {
      console.error("Erro ao carregar momentos:", err);
      setError(getFirebaseErrorMessage(err));
    });
    return () => unsub();
  }, []);

  async function handleSave() {
    setError("");
    if (!title.trim() || !date) {
      setError("Preencha o título e a data.");
      return;
    }
    if (!db) { setError("Firebase não configurado."); return; }

    const now = new Date().toISOString();
    try {
      setIsSaving(true);
      if (editingId) {
        await updateDoc(doc(db, "milestones", editingId), {
          title: title.trim(), description: description.trim(),
          date, emoji, updatedAt: now, updatedBy: currentUser,
        });
      } else {
        await addDoc(collection(db, "milestones"), {
          title: title.trim(), description: description.trim(),
          date, emoji, createdAt: now, updatedAt: now,
          createdBy: currentUser, updatedBy: currentUser,
        });
      }
      resetForm();
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, "milestones", id));
  }

  function handleEdit(item: Milestone) {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setDate(item.date);
    setEmoji(item.emoji ?? "💕");
    setShowForm(true);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setDate("");
    setEmoji("💕"); setError(""); setEditingId(null);
    setShowForm(false);
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    const months = ["jan", "fev", "mar", "abr", "mai", "jun",
                    "jul", "ago", "set", "out", "nov", "dez"];
    return { day, month: months[parseInt(month) - 1], year };
  };

  return (
    <div className="min-h-screen w-full px-5 pt-8 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-romantic text-5xl text-primary mb-1">Nossos Momentos</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          A trilha da nossa história ❤️
        </p>
      </motion.div>

      {/* Trilha */}
      <div className="relative">
        {/* Linha vertical */}
        {milestones.length > 0 && (
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-pink-300 to-primary/20" />
        )}

        <div className="space-y-8">
          {milestones.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-slate-400 dark:text-slate-500"
            >
              <Heart className="w-12 h-12 mx-auto mb-3 text-primary/30 fill-current" />
              <p className="text-sm">Nenhum momento ainda.</p>
              <p className="text-sm">Adicione o primeiro! 💕</p>
            </motion.div>
          )}

          {milestones.map((item, index) => {
            const { day, month, year } = formatDate(item.date);
            const isLast = index === milestones.length - 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex gap-4 items-start"
              >
                {/* Dot na trilha */}
                <div className="flex-shrink-0 w-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md z-10 ${isLast ? "bg-primary" : "bg-white dark:bg-slate-900 border-2 border-primary"}`}>
                    {item.emoji ?? "💕"}
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-md border border-slate-100 dark:border-slate-800 mb-1">
                  {/* Data */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-black text-primary">{day}</span>
                      <div className="flex flex-col leading-none">
                        <span className="text-xs font-bold text-primary uppercase">{month}</span>
                        <span className="text-xs text-slate-400">{year}</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-3 uppercase tracking-wider">
                    por {item.createdBy}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Botão de adicionar no fim da trilha */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 items-center"
          >
            <div className="flex-shrink-0 w-10 flex items-center justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-primary font-semibold"
            >
              Adicionar momento
            </button>
          </motion.div>
        </div>
      </div>

      {/* Modal de formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={resetForm}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {editingId ? "Editar momento" : "Novo momento"}
                </h3>
                <button onClick={resetForm} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Emoji picker */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ícone</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${emoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "bg-slate-100 dark:bg-slate-800 hover:scale-105"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <input
                placeholder="Título do momento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mb-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
              />

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full mb-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
              />

              <textarea
                placeholder="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full mb-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />

              {error && (
                <p className="mb-3 text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-60"
              >
                {isSaving ? "Salvando..." : editingId ? "Salvar edição" : "Salvar momento ❤️"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
