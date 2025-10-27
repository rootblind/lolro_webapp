import { Link } from 'react-router'
import {oauthURL} from "../utils/utils.js"
import NavbarUserDropdown from './NabarUserDropdown.jsx'
import { useSessionContext } from '../context/SessionContext.jsx'


const Navbar = () => {
  const {loading, isAuth} = useSessionContext();
  return (
    <header className='bg-base-300 border-b border-base-content/10'>
        <div className='mx-auto max-w-7xl p-4'>
            <div className='flex items-center justify-between'>
                <Link to={"/"}>
                    <img src={"/icon.svg"} width={"64"} height={"64"} />
                </Link>
                <div className='flex items-center gap-4'>
                    {!loading && !isAuth && (
                        <a href={oauthURL} className="btn btn-primary">
                            <img src={"src/assets/discord.svg"} width={"32"} height={"32"} />
                            <span>Log in with Discord</span>
                        </a>
                    )}
                    
                    {isAuth && ( <NavbarUserDropdown /> )}
                </div>

            </div>

        </div>
    </header>
  )
}

export default Navbar