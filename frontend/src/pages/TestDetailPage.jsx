import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router";
import api from "../utils/axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, LoaderIcon, Trash2Icon } from "lucide-react";

const TestDetailPage = () => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const {id} = useParams();

  useEffect(() => {
    const fetchTest = async ()=> {
      try {
        const res = await api.get(`/${id}`);
        setTest(res.data);
      } catch (error) {
        toast.error("Failed to fetch the test!");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchTest();
  }, [id]);

  const handleDelete = async () => {
    if(!window.confirm("This test will be deleted permanently, are you sure?")) return;

    try{
      await api.delete(`/${id}`);
      toast.success("Test deleted");
      navigate("/");
    } catch(error) {
      toast.error("Something went wrong...");
      console.error(error);
    }
  };
  const handleSave = async () => {
    if(!test.name.trim()) {
      toast.error("Empty name input!");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/${id}`, test);
      toast.success("Test updated!");
      navigate("/")
    } catch (error) {
      toast.error("Failed to update!");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if(loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <LoaderIcon className="animate-spin size-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="btn btn-ghost">
              <ArrowLeftIcon className="h-5 w-5" />
                Back to tests
            </Link>
            <button onClick={handleDelete} className="btn btn-error btn-outline">
              <Trash2Icon className="w-5 h-5" />
              Delete Test
            </button>
          </div>
          <div className="card bg-base-100">
            <div className="card-body">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">
                    Name
                  </span>
                </label>
                <input 
                  type='text'
                  placeholder="Test name"
                  className="input input-bordered"
                  value={test.name}
                  onChange={(e) => setTest({...test, name: e.target.value})}
                />
              </div>

              <div className="card-actions justify-end">
                <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default TestDetailPage