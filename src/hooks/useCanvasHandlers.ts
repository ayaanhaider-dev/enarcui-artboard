import { useCallback } from "react";
import { DrawingObject } from "../components/ArtBoard";

export interface CanvasHandlersProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  objects: DrawingObject[];
  setObjects: React.Dispatch<React.SetStateAction<DrawingObject[]>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<number | null>>;
  selectedObject: number | null;
  setHistory: React.Dispatch<React.SetStateAction<DrawingObject[][]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  history: DrawingObject[][];
  historyIndex: number;
}

export const useCanvasHandlers = ({
  canvasRef,
  objects,
  setObjects,
  setSelectedObject,
  selectedObject,
  setHistory,
  setHistoryIndex,
  history,
  historyIndex,
}: CanvasHandlersProps) => {
  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setObjects(history[historyIndex - 1]);
    }
  }, [historyIndex, history, setObjects, setHistoryIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setObjects(history[historyIndex + 1]);
    }
  }, [historyIndex, history, setObjects, setHistoryIndex]);

  // Delete selected object
  const handleDelete = useCallback(() => {
    if (selectedObject !== null && selectedObject >= 0) {
      const newObjects = objects.filter((_, index) => index !== selectedObject);
      setObjects(newObjects);
      setSelectedObject(null);
      setHistory([...history.slice(0, historyIndex + 1), newObjects]);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [
    selectedObject,
    objects,
    setObjects,
    setSelectedObject,
    setHistory,
    history,
    historyIndex,
    setHistoryIndex,
  ]);

  // Clear all objects
  const handleClearCanvas = useCallback(() => {
    setObjects([]);
    setSelectedObject(null);
    setHistory([...history.slice(0, historyIndex + 1), []]);
    setHistoryIndex((prev) => prev + 1);
  }, [
    setObjects,
    setSelectedObject,
    setHistory,
    history,
    historyIndex,
    setHistoryIndex,
  ]);

  // Export canvas as image
  const handleExportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, [canvasRef]);

  // Return handlers
  return {
    undo,
    redo,
    handleDelete,
    handleClearCanvas,
    handleExportImage,
  };
};
