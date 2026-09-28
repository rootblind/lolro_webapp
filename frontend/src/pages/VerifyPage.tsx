import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import api from "../utils/axios";
import LoadingComponent from "../components/LoadingComponent";
import { useSessionContext } from "../context/SessionContext";
import getBrowserADN from "../utils/adn";
import { VerificationStatusType } from "../utils/data_types";

interface VerificationResponse {
    success: boolean;
    verification_status: VerificationStatusType;
    risk?: unknown;
    error?: string;
}

const VerifyPage = () => {
    const { verificationStatus, setVerificationStatus } = useSessionContext();
    const [loading, setLoading] = useState(true);


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

                setVerificationStatus(response.data.verification_status);
                if (cancelled) {
                    return;
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error("Verification failed:", error);

               
                if (isAxiosError<VerificationResponse>(error) && error.response?.data) {
                    // const data = error.response.data;
                    // TODO: HANDLE ERRORS
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
    }, [setVerificationStatus]);

    if (loading) {
        return <LoadingComponent />;
    }
    return (
        <div>
            <p>Response: {verificationStatus}</p>
        </div>
    );
};

export default VerifyPage;
