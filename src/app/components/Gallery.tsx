import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

import { db, storage, ensureAuth } from "../../Firebase";

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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentUser = localStorage.getItem("currentUser") ?? "Anônimo";

  function getUserName() {
    return currentUser;
  }

  // 📥 realtime firestore
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const initGallery = async () => {
      await ensureAuth(); // Espera o login anônimo antes de pedir os dados
      const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
      unsub = onSnapshot(q, (snap) => {
        setPhotos(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Photo[]
        );
      });
    };

    initGallery();

    return () => unsub?.();
  }, []);

  // ☁️ upload firebase storage
  async function uploadImage(file: File) {
    await ensureAuth();
    const fileRef = ref(storage, `photos/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  // ➕ ADD FOTO
  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const url = await uploadImage(file);

      await addDoc(collection(db, "photos"), {
        url,
        caption: "Nova memória ❤️",
        createdAt: new Date().toISOString(),
        createdBy: getUserName(),
      });

      toast.success("Imagem enviada com sucesso! ❤️");
    } catch (err: any) {
      console.error("Erro ao enviar imagem:", err);
      const message = err?.code === "storage/unauthorized"
        ? "Permissão negada. Verifique as regras do Firebase Storage."
        : "Erro ao enviar imagem. Tente novamente.";
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
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

    try {
      const url = await uploadImage(file);
      await updateDoc(doc(db, "photos", selectedPhoto.id), { url });
    } catch (err) {
      console.error("Erro ao trocar imagem:", err);
    }
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
      <label className={`text-white p-3 rounded-xl block text-center mb-2 cursor-pointer transition-opacity ${uploading ? "bg-pink-300 opacity-60 pointer-events-none" : "bg-pink-400"}`}>
        {uploading ? "Enviando... ⏳" : "Adicionar Foto ❤️"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAdd}
          disabled={uploading}
        />
      </label>

      {uploadError && (
        <p className="text-red-500 text-sm text-center mb-4">{uploadError}</p>
      )}

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