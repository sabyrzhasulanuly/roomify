import { useParams } from "react-router";
import { useEffect, useState } from "react";

export default function VisualizerId() {
  const { id } = useParams();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const storedImage = sessionStorage.getItem(id);
      setImage(storedImage);
    }
  }, [id]);

  if (!id) {
    return <div>Invalid ID</div>;
  }

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-xl font-semibold">Image missing</div>
        <div className="text-gray-500">Could not find the uploaded image for ID: {id}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-2xl font-bold">Visualizer Id: {id}</h1>
      <div className="max-w-4xl w-full rounded-lg overflow-hidden shadow-xl">
        <img src={image} alt="Uploaded floor plan" className="w-full h-auto" />
      </div>
    </div>
  );
}