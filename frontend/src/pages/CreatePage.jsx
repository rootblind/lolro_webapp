import React, { useState } from 'react'
import { Link, useNavigate } from "react-router"
import {ArrowLeftIcon} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/axios'


const CreatePage = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!name.trim()) {
      toast.error("No name provided!")
      return;
    }

    setLoading(true);
    try {
      await api.post(`/`, {
        name
      });
      toast.success("Test created successfully!");
      navigate("/")
    } catch (error) {
      if(error.response.status === 429) {
        toast.error("Slow down, you've been rate limited for a bit!", {
          duration: 4000,
          icon: "🤯"
        });
      } else {
        toast.error("Failed to create!");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-base-200'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          <Link to={"/"} className='btn btn-ghost mb-6'>
            <ArrowLeftIcon className='size-5' />
            Back To Tests
          </Link>
          <div className='card bg-base-100'>
            <div className='card-body'>
              <h2 className='card-title text-2xl mb-4'>
                Create new Test
              </h2>
              <form onSubmit={handleSubmit}>
                <div className='from-control mb-4'>
                  <label className="label">
                    <span className='label-text'>
                      Name
                    </span>
                  </label>
                  <input type="text"
                      placeholder='Test name' 
                      className='input input-bordered'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className='card-actions justify-end'>
                  <button type="submit" className='btn btn-primary' disabled={loading}>
                    {loading ? "Creating..." : "Create Test"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePage