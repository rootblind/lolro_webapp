import {useState, useEffect} from "react";
import {RefreshCcw} from "lucide-react";
import toast from "react-hot-toast";

import api from "../utils/axios";

const CaptchaForm = ({ onSolved }) => {
    const [captchaSVG, setCaptchaSVG] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [loading, setLoading] = useState(false);

    const loadCaptcha = async () => {
        setLoading(true);
        try {
            const res = await api.get("/captcha/create", {withCredentials: true});

            setCaptchaSVG(res.data);
            setCaptchaInput("");
        } catch(error) {
            toast.error("Failed to load captcha!");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCaptcha();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/captcha/verify/", {captchaInput}, {withCredentials: true});
            if(res.data.success) {
                onSolved?.();
                toast.success("Captcha solved");
            } else {
                toast.error("Wrong input");
            }
        } catch(error) {
            toast.error("Error verifying");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card w-full max-w-md bg-base-200 shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-center mb-4">CAPTCHA Verification</h2>

            <div className="flex justify-center bg-base-300 rounded-lg p-2">
                {loading ? (
                    <span className="loading loading-spinner loading-md"></span>
                ) : (
                    <div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-row justify-center items-center gap-4 p-4">
                                <div className="cursor-pointer select-none" 
                                    onClick={loadCaptcha} 
                                    dangerouslySetInnerHTML={{ __html: captchaSVG}}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={loadCaptcha}
                                >
                                    <RefreshCcw />
                                </button>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    className="input input-bordered w-full text-center"
                                    placeholder="Enter CAPTCHA..."
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? "btn-disabled" : ""}`}    
                            >
                                {loading ? "Submiting" : "Submit"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}


export default CaptchaForm;