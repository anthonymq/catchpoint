import { useParams, useNavigate } from "react-router-dom";

export default function CatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full p-4">
      <button onClick={() => navigate(-1)} className="mb-4">
        Back
      </button>
      <h1>Catch Detail</h1>
      <p>ID: {id}</p>
    </div>
  );
}
