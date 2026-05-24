import { useParams } from "react-router";

export default function VisualizerId() {
  const { id } = useParams();

  if (!id) {
    return <div>Invalid ID</div>;
  }

  return <div>Visualizer Id: {id}</div>;
}