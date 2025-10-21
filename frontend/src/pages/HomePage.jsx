import Navbar from "../components/Navbar"
import TestCard from "../components/TestCard"
import RateLimitedUI from "../components/RateLimitedUI"
import api from "../utils/axios"
import TestsNotFound from "../components/TestsNotfound"

import { useEffect, useState } from "react"
import axios from "axios"
import toast from 'react-hot-toast'

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get("/");
        console.log(res.data);

        setTests(res.data);
        setIsRateLimited(false);
      } catch(err) {
        console.error(err);
        if(err.response.status === 429) {
          setIsRateLimited(true);
        } else {
          toast.error("Failed")
        }
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      {isRateLimited && <RateLimitedUI />}

      <div className="max-w-7xl mx-auto p-4 mt-6">
        {loading && <div className="text-center text-primary py-10">Loading</div>}

        {!loading && tests.length === 0 && !isRateLimited && <TestsNotFound />}
          {tests.length > 0 && !isRateLimited && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <TestCard key={test.id} test={test} setTests={setTests}/>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

export default HomePage