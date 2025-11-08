import toast from 'react-hot-toast'
import { useSessionContext } from "../context/SessionContext"
import {Link} from "react-router"
import CaptchaForm from '../components/CaptchaForm'
import {useState, useEffect} from "react";
import api from "../utils/axios"

const HomePage = () => {
  const {user, isAuth, isVerified} = useSessionContext();
  const [captchaSolved, setCaptchaSolved] = useState(false);

  const handleCaptchaSolved = () => {
    setCaptchaSolved(true);
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-base-100 rounded-2xl shadow-lg p-10 text-center">
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {isAuth ? (
            <div>
              Welcome, {user.username}
            </div>
          ) : (
            <div>
              Welcome to LOLRO
            </div>
          )}
        </h1>


        {!isAuth && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 mb-4 text-lg">
              You are visiting this site as a guest.
            </p>
            <p className='mb-10 text-lg'>
              Connect with your Discord account to unlock full access and verify your account.
            </p>
            <ul className="list-disc list-inside">
              <p className='text-2xl'>Attention</p>
              <li>Access to our services requires being a member of our Discord server</li>
              <li>Being banned or not a member will not grant access</li>
              <li>Connecting and/or verifying an alternate account will result in a permanent ban on all associated accounts</li>
            </ul>
              
            
            <p className="text-sm text-gray-400 max-w-xs">
              By logging in, you agree to our <Link to="/privacy" className="underline text-blue-600">Privacy Policy</Link>
              <br />
              and give consent to the collection of your Discord account information such as:
            </p>
            <ul className="list-disc list-inside mb-4 text-sm text-gray-400 max-w-xs">
              <li>Username, avatar and banner</li>
              <li>Email address</li>
              <li>Third-party connections</li>
              <li>What servers you're in</li>
            </ul>
          </div>
        )}

        {isAuth && !isVerified && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 mb-4 text-lg">
              It seems your account is not verified, proceed with verification to unlock full access to LOLRO.
            </p>
            
            {captchaSolved ? (
              <Link to={"/verify"}>
                <button className="btn btn-success btn-lg px-8">
                  Verify
                </button>
              </Link>
            ) : (
              <CaptchaForm onSolved={handleCaptchaSolved}/>
            )}

            <p className="text-sm text-gray-400 max-w-xs">
              By verifying your account, you agree to our <Link to="/privacy" className="underline text-blue-600">Privacy Policy</Link> and <Link to={"/terms"} className='underline text-blue-600'>Terms of Service</Link>
              <br />
              and give consent to the collection of additional data such as:
            </p>
            <ul className="list-disc list-inside mb-4 text-sm text-gray-400 max-w-xs">
              <li>IP address</li>
              <li>Browser / device data</li>
              <li>Cookies & session identifiers</li>
            </ul>
          </div>
        )}
      </div>
    </div>

  )
}

export default HomePage