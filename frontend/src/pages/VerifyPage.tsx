import { useEffect } from "react";
import api from "../utils/axios";
import { useState } from "react";

import LoadingComponent from "../components/LoadingComponent";
//import getBrowserADN from "../utils/adn";
import { useSessionContext } from "../context/SessionContext";

const VerifyPage = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {isVerified, setVerified} = useSessionContext();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const res = await api.get("/verify/", {withCredentials: true});
                setVerified(res.data.verified);
            } catch (error) {
                console.error(error);
            }
        }

        init();
    }, []);

    if(loading) return <LoadingComponent />
    
    return (
        <div>
            {!loading && (
                <div>
                    x
                </div>
            )}
        </div>
    )
}

export default VerifyPage;