import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, Trash2, Pencil } from "lucide-react";

import { db, auth, storage } from "../../Firebase";

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

import { onAuthStateChanged } from "firebase/auth";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

type Photo = {
  id: string;
  url: string;
  caption: string;
  createdAt: string;
  createdBy: string;
};

export default function Gallery() {
  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState("");

  // 👤 usuário real
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  function getUserName() {
    return user?.displayName || user?.email || "Anônimo";
  }

  // 📥 realtime firestore
  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setPhotos(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Photo[]
      );
    });

    return () => unsub();
  }, []);

  // ☁️ upload firebase storage
  async function uploadImage(file: File) {
    const fileRef = ref(storage, `photos/${Date.now()}-${file.name}`);

    await uploadBytes(fileRef, file);

    return await getDownloadURL(fileRef);
  }

  // ➕ ADD FOTO
  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);

      await addDoc(collection(db, "photos"), {
        url,
        caption: "Nova memória ❤️",
        createdAt: new Date().toISOString(),
        createdBy: getUserName(),
      });
    } catch (err) {
      console.error("Erro ao enviar imagem:", err);
    }

    e.target.value = "";
  }

  // ❌ DELETE
  async function handleDelete(id: string) {
    await deleteDoc(doc(db, "photos", id));
    setSelectedPhoto(null);
  }

  // 🖼 EDIT IMAGE
  async function handleEditImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedPhoto) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);

    await updateDoc(doc(db, "photos", selectedPhoto.id), {
      url,
    });
  }

  // ✏️ EDIT CAPTION
  async function saveCaption() {
    if (!selectedPhoto) return;

    await updateDoc(doc(db, "photos", selectedPhoto.id), {
      caption,
    });

    setEditingCaption(false);
  }

  return (
    <div className="min-h-screen w-full p-6 pt-8">
      <h1 className="text-center text-4xl text-primary mb-6">
        Nossas Memórias 💕
      </h1>

      {/* ADD */}
      <label className="bg-pink-400 text-white p-3 rounded-xl block text-center mb-6 cursor-pointer">
        Adicionar Foto ❤️
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAdd}
        />
      </label>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            className="relative aspect-square rounded-3xl overflow-hidden cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-2 left-2 text-white text-sm">
              {photo.caption}
            </div>
          </motion.div>
        ))}
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full relative"
            >
              <img
                src={selectedPhoto.url}
                className="w-full rounded-3xl mb-4"
              />

              {/* CAPTION */}
              <div className="bg-white/10 text-white p-4 rounded-xl mb-4">
                {editingCaption ? (
                  <>
                    <input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full p-2 text-black rounded mb-2"
                    />
                    <button onClick={saveCaption}>Salvar</button>
                  </>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Heart className="text-pink-400 fill-current" />
                    <p>{selectedPhoto.caption}</p>
                  </div>
                )}
              </div>

              {/* AÇÕES */}
              <div className="flex gap-2">
                <label className="bg-white p-3 rounded-xl flex-1 text-center cursor-pointer">
                  <Pencil />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditImage}
                  />
                </label>

                <button
                  onClick={() => {
                    setEditingCaption(true);
                    setCaption(selectedPhoto.caption);
                  }}
                  className="bg-yellow-400 p-3 rounded-xl flex-1"
                >
                  Texto
                </button>

                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  className="bg-red-500 text-white p-3 rounded-xl flex-1"
                >
                  <Trash2 />
                </button>
              </div>

              {/* FECHAR */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-6 right-6 text-white"
              >
                <X />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}