import { useRef } from "react";
import { useEffect } from "react";
import {useState} from "react";
import {ChevronDown, ChevronUp} from "lucide-react";
import api from "../utils/axios";
import { useSessionContext } from "../context/SessionContext";

const NavbarUserDropdown = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const {user, setAuth} = useSessionContext();

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if(ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        await api.post("/auth/logout", {}, {withCredentials: true});
        setAuth(false);
    };

    return (
        <div ref={ref} className="relative">
            <div
                className="btn btn-success cursor-pointer font-semibold flex items-center gap-1"
                onClick={() => setOpen((prev) => !prev)}
            >
                {user.username} {open ? (<ChevronUp />) : (<ChevronDown />)}
            </div>

            {open && (
                <div className="absolute right-0 mt-2 bg-base-100 border rounded p-2 shadow">
                    <button
                        onClick={handleLogout}
                        className="btn btn-error btn-sm w-full text-white"
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
    )
}

export default NavbarUserDropdown;