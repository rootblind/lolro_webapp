import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/axios";

const SessionContext = createContext();

export const SessionContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuth, setAuth] = useState(false);
  const [isVerified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleRateLimited = () => setIsRateLimited(true);

  useEffect(() => {
    const fetchSession = async () => {
      try{
        const res = await api.get("/auth/me", { withCredentials: true });
        if(res.data.loggedIn) {
          setUser(res.data.user || null);
          setAuth(res.data.loggedIn);
        }
        
      } catch(error) {
        if(error.response?.status === 429) {
          handleRateLimited();
        } else {
          console.error(error);
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    window.addEventListener("rate-limited", handleRateLimited);
    return () => window.removeEventListener("rate-limited", handleRateLimited)
  }, [])

  return (
    <SessionContext.Provider value={{ 
        user, setUser, isAuth, setAuth, loading, setLoading,
        isRateLimited, setIsRateLimited
      }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => useContext(SessionContext);
