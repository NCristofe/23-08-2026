import { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";

import { db, ensureAuth } from "../../Firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

type Milestone = {
  id: string;
  title: string;
  description: string;
  date: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  history?: any[];
};

export default function Timeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const currentUser = localStorage.getItem("currentUser") ?? "Anônimo";

  function getUserName() {
    return currentUser;
  }

  // 🔥 carregar dados em tempo real
  useEffect(() => {
    let unsub: () => void;

    const init = async () => {
      await ensureAuth();

      const q = query(
        collection(db, "milestones"),
        orderBy("createdAt", "desc")
      );

      unsub = onSnapshot(q, (snapshot) => {
        setMilestones(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Milestone[]
        );
      });
    };

    init();

    return () => unsub?.();
  }, []);

  // ➕ ou ✏️ salvar
  async function handleSave() {
    if (!title || !date || !db) return;

    const now = new Date().toISOString();

    if (editingId) {
      await updateDoc(doc(db, "milestones", editingId), {
        title,
        description,
        date,
        updatedAt: now,
        updatedBy: getUserName(),
      });
    } else {
      await addDoc(collection(db, "milestones"), {
        title,
        description,
        date,

        createdAt: now,
        updatedAt: now,
        createdBy: getUserName(),
        updatedBy: getUserName(),

        history: [],
      });
    }

    resetForm();
  }

  // ❌ deletar
  async function handleDelete(id: string) {
    if (!db) return;

    await deleteDoc(doc(db, "milestones", id));
  }

  function handleEdit(item: Milestone) {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setDate(item.date);
    setShowForm(true);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setDate("");
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen w-full p-6 pb-24">
      <h1 className="text-3xl text-center mb-6 text-pink-500">
        Nossos Marcos 💕
      </h1>

      {/* BOTÃO */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full mb-6 bg-pink-400 text-white py-3 rounded-xl"
      >
        + Adicionar momento
      </button>

      {/* FORM */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg mb-6 border border-transparent dark:border-slate-800 transition-colors">
          <input
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-pink-400"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mb-3 p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-pink-400"
          />

          <textarea
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mb-3 p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-pink-400"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="w-full bg-green-500 text-white py-2 rounded"
            >
              {editingId ? "Salvar edição" : "Salvar ❤️"}
            </button>

            <button
              onClick={resetForm}
              className="w-full bg-gray-300 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LISTA */}
      <div className="space-y-6">
        {milestones.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md border border-transparent dark:border-slate-800 transition-colors"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {item.date}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-300"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              {item.title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {item.description}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              <p>Criado por: {item.createdBy}</p>
              <p>Atualizado por: {item.updatedBy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
