import { PenSquareIcon, Trash2Icon } from "lucide-react"
import { Link } from "react-router"
import api from "../utils/axios"
import toast from "react-hot-toast"

const TestCard = ({test, setTests}) => {

  const handleDelete = async (e, id) => {
    e.preventDefault();

    if(!window.confirm("This test will be deleted permanently, are you sure?")) return;

    try {
        await api.delete(`/${test.id}`);
        setTests((prev) => prev.filter(x => x.id != test.id))
        toast.success("Test deleted!");
    } catch (error) {
        toast.error("Failed to delete the test!");
        console.error(error);
    }
  }
  return (
    <Link to={`/test/${test.id}`}
        className="card bg-base-100 hover:shadow-lg transition-all duration-200 border-t-4
            border-solid border-[#00FF9D]">

        <div className="card-body">
            <h3 className="card-title text-base-content">
                {test.name}
            </h3>
            <p className="text-base-content/70 line-clamp-3">
                {test.name}
            </p>
            <div className="card-actions justify-between items-center mt-4">
                <span className="text-sm text-base-content/60">
                    {test.name}
                </span>
                <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs">
                        <PenSquareIcon className="size-4" />
                    </button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={(e) => handleDelete(e, test.id)}>
                        <Trash2Icon className="size-4" />
                    </button>
                </div>
            </div>
        </div>

    </Link>
  )
}

export default TestCard