import { useEffect, useState } from "react";
import api from "../services/api";

const Home = () => {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    const serverCheck = async () => {
      try {
        const res = await api.get("/health");
        setMessage(res.data.message);
      } catch (err) {
        console.error(err);
        setMessage("Backend connection failed ❌");
      }
    };

    serverCheck();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">{message}</h1>
    </div>
  );
};

export default Home;
