import { useEffect, useState } from "react";
import axios from "axios";

export const Card = () => {
  const [personagens, setPersonagens] = useState([]);

  useEffect(() => {
    axios
      .get("https://rickandmortyapi.com/api/character")
      .then(res => setPersonagens(res.data.results));
  }, []);

  return (
    <div>
      {personagens.map(p => (
        <div key={p.id}>
          <img src={p.image} />
          <p>{p.name}</p>
        </div>
      ))}
    </div>
  );
};