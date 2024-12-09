import { useCallback } from "react";
import { DrawingObject } from "../components/ArtBoard";

interface CanvasEventsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  objects: DrawingObject[];
  setObjects: React.Dispatch<React.SetStateAction<DrawingObject[]>>;
  setStartPos: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
  setResizeHandle: React.Dispatch<React.SetStateAction<number | null>>;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<number | null>>;
  startPos: { x: number; y: number } | null;
  resizeHandle: number | null;
  tool: "brush" | "circle" | "arrow" | "rect" | "select" | "eraser";
  brushColor: string;
  brushRadius: number;
  selectedObject: number | null;
  isDrawing: boolean;
  addToHistory: (newObjects: DrawingObject[]) => void;
}

export const useCanvasEvents = ({
  canvasRef,
  objects,
  setObjects,
  setStartPos,
  setResizeHandle,
  setIsDrawing,
  setSelectedObject,
  startPos,
  resizeHandle,
  tool,
  brushColor,
  brushRadius,
  selectedObject,
  isDrawing,
  addToHistory,
}: CanvasEventsProps) => {
  // Get mouse position relative to the canvas
  const getCanvasPos = useCallback(
    (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ("touches" in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [canvasRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      setIsDrawing(true);
      setStartPos(pos);

      if (tool === "select") {
        // Check for object selection
        const clickedObject = objects
          .map((obj, index) => ({ obj, index }))
          .reverse()
          .find(({ obj }) => {
            const { x, y, width, height } = obj.bounds;
            return (
              pos.x >= x &&
              pos.x <= x + width &&
              pos.y >= y &&
              pos.y <= y + height
            );
          });

        if (clickedObject) {
          const newObjects = objects.map((obj, i) => ({
            ...obj,
            selected: i === clickedObject.index,
          }));
          setObjects(newObjects);
          setSelectedObject(clickedObject.index);
        } else {
          const newObjects = objects.map((obj) => ({
            ...obj,
            selected: false,
          }));
          setObjects(newObjects);
          setSelectedObject(null);
        }
        return;
      }

      const newObject: DrawingObject = {
        type: tool === "brush" ? "brush" : tool,
        points: [pos],
        stroke: brushColor,
        strokeWidth: brushRadius,
        bounds: { x: pos.x, y: pos.y, width: 0, height: 0 },
        selected: false,
      };

      setObjects([...objects, newObject]);
    },
    [
      tool,
      getCanvasPos,
      objects,
      setIsDrawing,
      setStartPos,
      brushColor,
      brushRadius,
      addToHistory,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const pos = getCanvasPos(e);

      if (tool === "select" && selectedObject !== null) {
        const newObjects = [...objects];
        const obj = newObjects[selectedObject];
        if (!startPos) return;

        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        obj.bounds.x += dx;
        obj.bounds.y += dy;
        obj.points = obj.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }));
        setObjects(newObjects);
        setStartPos(pos);
        return;
      }

      const newObjects = [...objects];
      const currentObject = newObjects[newObjects.length - 1];

      if (!currentObject) return;

      if (tool === "brush" || tool === "eraser") {
        currentObject.points.push(pos);
        if (tool === "eraser") {
          // Optionally, you can set a specific stroke color or other properties
          // For 'destination-out', color doesn't matter, but keeping it for consistency
          currentObject.stroke = "rgba(0,0,0,1)"; // Color is irrelevant for 'destination-out'
        }
      } else if (startPos) {
        currentObject.points = [startPos, pos];
      }

      currentObject.bounds = {
        x: Math.min(currentObject.points[0].x, currentObject.points[1].x),
        y: Math.min(currentObject.points[0].y, currentObject.points[1].y),
        width: Math.abs(currentObject.points[1].x - currentObject.points[0].x),
        height: Math.abs(currentObject.points[1].y - currentObject.points[0].y),
      };

      setObjects(newObjects);
    },
    [
      tool,
      isDrawing,
      objects,
      selectedObject,
      startPos,
      setStartPos,
      getCanvasPos,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      addToHistory([...objects]);
    }
    setIsDrawing(false);
  }, [isDrawing, objects, addToHistory]);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as unknown as React.MouseEvent<HTMLCanvasElement>;

    handleMouseDown(simulatedEvent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const simulatedEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as unknown as React.MouseEvent<HTMLCanvasElement>;

    handleMouseMove(simulatedEvent);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
