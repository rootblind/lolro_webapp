import { createContext, use, useState, useEffect } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import api from "../utils/axios";
import { isAxiosError } from "axios";
import { UserInfo, VerificationStatusType } from "../utils/data_types.js";

interface SessionContextProviderProps {
    children: ReactNode
};

interface SessionContextType {
    user: UserInfo | null,
    setUser: Dispatch<SetStateAction<UserInfo | null>>,
    isAuth: boolean,
    setAuth: Dispatch<SetStateAction<boolean>>,
    loading: boolean,
    setLoading: Dispatch<SetStateAction<boolean>>,
    isRateLimited: boolean,
    setIsRateLimited: Dispatch<SetStateAction<boolean>>,
    isBanned: boolean,
    setIsBanned: Dispatch<SetStateAction<boolean>>,
    verificationStatus: VerificationStatusType | null,
    setVerificationStatus: Dispatch<SetStateAction<VerificationStatusType | null>>
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatusType | null>(null);

    const handleRateLimited = () => setIsRateLimited(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await api.get<{user: UserInfo, loggedIn: boolean}>("/auth/me", { withCredentials: true });
                if (res.data.loggedIn) {
                    setUser(res.data.user ?? null);
                    setIsAuth(res.data.loggedIn);
                    setIsBanned(res.data.user?.banned ?? false);
                    setVerificationStatus(res.data.user.verification_status_type ?? null)
                }

            } catch (error) {
                if (isAxiosError(error)) {
                    if (error.response?.status === 429) {
                        handleRateLimited();
                    } else {
                        console.error(error);
                    }
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
        <SessionContext value={{
            user, setUser,
            isAuth, setAuth: setIsAuth,
            loading, setLoading,
            isRateLimited, setIsRateLimited,
            isBanned, setIsBanned,
            verificationStatus, setVerificationStatus
        }}>
            {children}
        </SessionContext>
    );
};

export const useSessionContext = (): SessionContextType => {
    const context = use(SessionContext);

    if (!context) {
        throw new Error("useSessionContext must be used within a SessionContext, but is null");
    }

    return context;
}