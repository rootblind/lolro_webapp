import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import api from "../utils/axios";
import LoadingComponent from "../components/LoadingComponent";
import { useSessionContext } from "../context/SessionContext";
import getBrowserADN from "../utils/adn";

type VerificationDecision =
    | "allow"
    | "additional_verification"
    | "manual_review"
    | "deny_verification"
    | "banned";

interface VerificationResponse {
    success: boolean;
    verified: boolean;
    decision?: VerificationDecision;
    awaits_manual_verification?: boolean;
    risk?: unknown;
    error?: string;
}

const VerifyPage = () => {
    const { setVerified } = useSessionContext();
    const [loading, setLoading] = useState(true);
    const [decision, setDecision] = useState<VerificationDecision | null>(null);

    const hasRun = useRef(false); // avoid double invoking

    useEffect(() => {
        if (hasRun.current) {
            return;
        }
        hasRun.current = true;
        let cancelled = false;
        const verify = async () => {
            try {
                setLoading(true);
                const adn = await getBrowserADN(); // collect fingerprint from fingerprintjs

                // send the fingerprint and agent to the backend
                await api.post(
                    "/verify/adn",
                    {
                        adn,
                        userAgent: navigator.userAgent,
                    },
                    {
                        withCredentials: true,
                    },
                );

                // forward the ip to the backend
                await api.post(
                    "/verify/ip",
                    undefined,
                    {
                        withCredentials: true,
                    },
                );

                // request the evaluation process for the info previously forwarded
                const response = await api.get<VerificationResponse>(
                        "/verify",
                        {
                            withCredentials: true,
                        },
                    );

                setVerified(response.data.verified);
                setDecision(response.data.decision ?? null);
                if (cancelled) {
                    return;
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error("Verification failed:", error);

                // getVerified returns HTTP 403 for the "banned" users and deny_verification members. 
                // Axios throws on any non 2xx response
                if (isAxiosError<VerificationResponse>(error) && error.response?.data) {
                    const data = error.response.data;
                    setVerified(Boolean(data.verified));
                    setDecision(data.decision ?? null);
                    return;
                }
            } finally {
                    setLoading(false);
            }
        };

        void verify();

        return () => {
            cancelled = true;
        };
    }, [setVerified]);

    if (loading) {
        return <LoadingComponent />;
    }
    return (
        <div>
            {decision === "additional_verification" && (
                <p>
                    Additional verification is required.
                </p>
            )}
            {decision === "manual_review" && (
                <p>
                    Your verification requires manual review.
                </p>
            )}
            {decision === "deny_verification" && (
                <p>
                    Verification was denied.
                </p>
            )}
            {decision === "banned" && (
                <p>
                    This account is banned.
                </p>
            )}
            {decision === "allow" && (
                <div>
                    <p>Verification completed.</p>
                </div>
            )}
            <p>{decision}</p>
        </div>
    );
};

export default VerifyPage;