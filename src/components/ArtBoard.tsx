/* eslint-disable react-hooks/exhaustive-deps */
/**
 * EnarcUI ArtBoard: A versatile drawing tool component for React.
 *
 * This component provides a canvas for drawing, selecting, and manipulating various shapes like lines, rectangles, circles, and arrows.
 * Users can also utilize tools such as brushes and erasers, and import/export their drawings.
 *
 * Features:
 * - Draw shapes: Line, Circle, Rectangle, Arrow.
 * - Select and manipulate shapes.
 * - Undo/Redo history.
 * - Export drawings as an image.
 * - Background image support.
 * - Adjustable brush size and color.
 *
 * @example
 * // Basic usage
 * import React, { useRef } from "react";
 * import ArtBoard, { ArtBoardRef } from "./ArtBoard";
 *
 * const App = () => {
 *   const artBoardRef = useRef<ArtBoardRef>(null);
 *
 *   const handleExport = async () => {
 *     const imageData = await artBoardRef.current?.exportDrawing();
 *     console.log(imageData);
 *   };
 *
 *   return (
 *     <ArtBoard
 *       ref={artBoardRef}
 *       imageSrc="https://example.com/background.jpg"
 *     />
 *   );
 * };
 *
 * export default App;
 */

import {
  ArrowLeft,
  ArrowRight,
  Brush,
  Circle,
  Download,
  Eraser,
  Move,
  Square,
  Trash,
  Trash2,
} from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { HexColorPicker } from "react-colorful";
import styles from "../styles/ArtBoard.module.css";
/**
 * Represents a drawable object on the canvas.
 */

interface DrawingObject {
  type: "line" | "circle" | "arrow" | "rect"; // The type of object (e.g., line, circle).
  points: { x: number; y: number }[]; // The points defining the object.
  stroke: string; // The color of the stroke.
  strokeWidth: number; // The width of the stroke.
  bounds: {
    x: number; // X-coordinate of the bounding box.
    y: number; // Y-coordinate of the bounding box.
    width: number; // Width of the bounding box.
    height: number; // Height of the bounding box.
  };
  selected: boolean; // Whether the object is selected.
}
/**
 * Props for the ArtBoard component.
 */
interface ArtBoardProps {
  /**
   * Serialized drawing data to load into the ArtBoard.
   * This can be used to initialize the ArtBoard with existing drawings.
   *
   * @example
   * const existingData = "serialized-drawing-data";
   * <ArtBoard saveData={existingData} />;
   */
  saveData?: string;

  /**
   * Background image source URL to display on the canvas.
   * When provided, the image is drawn as a background for the canvas.
   *
   * @example
   * <ArtBoard imageSrc="https://example.com/background.jpg" />;
   */
  imageSrc?: string;
}

/**
 * Ref methods exposed by the ArtBoard component.
 */
export interface ArtBoardRef {
  /**
   * Exports the current drawing on the canvas as a base64-encoded PNG image.
   *
   * @returns {Promise<string>} A promise that resolves to the base64 representation of the canvas image.
   *
   * @example
   * const imageData = await artBoardRef.current?.exportDrawing();
   * console.log(imageData);
   */
  exportDrawing: () => Promise<string>;
}

/**
 * The ArtBoard component provides an interactive canvas for drawing and editing shapes.
 *
 * @component
 *
 * @param {Object} props - The props for the ArtBoard component.
 * @param {string} [props.saveData] - Serialized drawing data to initialize the canvas with existing drawings.
 * @param {string} [props.imageSrc] - Background image URL to render behind the drawings on the canvas.
 *
 * @returns {React.ReactElement} The rendered ArtBoard component.
 *
 * @example
 * // Basic usage
 * import React, { useRef } from "react";
 * import ArtBoard, { ArtBoardRef } from "./ArtBoard";
 *
 * const App = () => {
 *   const artBoardRef = useRef<ArtBoardRef>(null);
 *
 *   const handleExport = async () => {
 *     const imageData = await artBoardRef.current?.exportDrawing();
 *     console.log(imageData);
 *   };
 *
 *   return (
 *     <div>
 *       <ArtBoard
 *         ref={artBoardRef}
 *         saveData="existing-drawing-data"
 *         imageSrc="https://example.com/background.jpg"
 *       />
 *       <button onClick={handleExport}>Export Drawing</button>
 *     </div>
 *   );
 * };
 *
 * export default App;
 */

const ArtBoard = forwardRef<ArtBoardRef, ArtBoardProps>(
  ({ saveData, imageSrc }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // State for managing drawable objects
    const [objects, setObjects] = useState<DrawingObject[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Tool settings
    const [tool, setTool] = useState<
      "brush" | "circle" | "arrow" | "rect" | "select" | "eraser"
    >("brush");
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushRadius, setBrushRadius] = useState(5);

    // State for selected object
    const [selectedObject, setSelectedObject] = useState<number | null>(null);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
      null
    );
    const [resizeHandle, setResizeHandle] = useState<number | null>(null);

    // State for history (undo/redo functionality)
    const [history, setHistory] = useState<DrawingObject[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // State for background image
    const [backgroundImage, setBackgroundImage] =
      useState<HTMLImageElement | null>(null);

    useEffect(() => {
      if (imageSrc) {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          setBackgroundImage(img);
          drawObjects(); // Redraw canvas with the new image
        };
        img.onerror = () => {
          console.error("Failed to load image:", imageSrc);
          setBackgroundImage(null);
        };
      } else {
        setBackgroundImage(null);
        drawObjects(); // Redraw canvas without the image
      }
    }, [imageSrc]);

    // Calculate the bounding box of an object, considering stroke width
    const calculateBounds = (
      points: { x: number; y: number }[],
      strokeWidth: number
    ): { x: number; y: number; width: number; height: number } => {
      if (!points.length) return { x: 0, y: 0, width: 0, height: 0 };

      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs) - strokeWidth / 2;
      const maxX = Math.max(...xs) + strokeWidth / 2;
      const minY = Math.min(...ys) - strokeWidth / 2;
      const maxY = Math.max(...ys) + strokeWidth / 2;

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    };

    /**
     * Adds the current state of objects to history for undo/redo functionality.
     * @param {DrawingObject[]} newObjects - The updated objects array.
     */
    const addToHistory = (newObjects: DrawingObject[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, JSON.parse(JSON.stringify(newObjects))]);
      setHistoryIndex(historyIndex + 1);
    };

    /**
     * Handles the undo action to revert to the previous state.
     */
    const undo = () => {
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setObjects(history[historyIndex - 1]);
      }
    };

    /**
     * Handles the redo action to move forward to the next state.
     */
    const redo = () => {
      if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setObjects(history[historyIndex + 1]);
      }
    };

    // Check if a point is on a line using isPointInStroke
    const isPointOnLine = (
      point: { x: number; y: number },
      linePoints: { x: number; y: number }[],
      lineWidth: number
    ): boolean => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return false;

      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(linePoints[0].x, linePoints[0].y);
      for (let i = 1; i < linePoints.length; i++) {
        ctx.lineTo(linePoints[i].x, linePoints[i].y);
      }
      return ctx.isPointInStroke(point.x, point.y);
    };

    // Handle mouse down event
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      setIsDrawing(true);
      setStartPos(pos);

      if (tool === "select") {
        // Check for resize handles first
        const selectedObj =
          selectedObject !== null ? objects[selectedObject] : null;
        if (selectedObj) {
          const handleIndex = getHandleAtPosition(pos, selectedObj);
          if (handleIndex !== null) {
            setResizeHandle(handleIndex);
            return;
          }
        }

        // If no handle clicked, check for object selection
        const clickedObject = objects
          .map((obj, index) => ({ obj, index }))
          .reverse()
          .find(({ obj }) => {
            const { x, y, width, height } = obj.bounds;
            // First check bounding box
            if (
              pos.x >= x &&
              pos.x <= x + width &&
              pos.y >= y &&
              pos.y <= y + height
            ) {
              // For lines, use isPointOnLine for better accuracy
              if (obj.type === "line") {
                return isPointOnLine(pos, obj.points, obj.strokeWidth + 5); // Add some tolerance
              } else {
                return true;
              }
            }
            return false;
          });

        if (clickedObject) {
          const newObjects = objects.map((obj, i) => ({
            ...obj,
            selected: i === clickedObject.index,
          }));
          setObjects(newObjects);
          setSelectedObject(clickedObject.index);
        } else {
          // Deselect all if nothing is clicked
          const newObjects = objects.map((obj) => ({
            ...obj,
            selected: false,
          }));
          setObjects(newObjects);
          setSelectedObject(null);
        }
        return;
      }

      if (tool === "eraser") {
        const newObjects = objects.filter((obj) => {
          const { x, y, width, height } = obj.bounds;
          if (
            pos.x >= x &&
            pos.x <= x + width &&
            pos.y >= y &&
            pos.y <= y + height
          ) {
            if (obj.type === "line") {
              return !isPointOnLine(pos, obj.points, obj.strokeWidth + 5);
            } else {
              return false;
            }
          }
          return true;
        });
        if (newObjects.length !== objects.length) {
          setObjects(newObjects);
          addToHistory(newObjects);
        }
        return;
      }

      // Start a new object
      const newObject: DrawingObject = {
        type: tool === "brush" ? "line" : tool,
        points: [pos],
        stroke: brushColor,
        strokeWidth: brushRadius,
        bounds: { x: pos.x, y: pos.y, width: 0, height: 0 },
        selected: false,
      };

      setObjects([...objects, newObject]);
    };

    // Handle mouse move event
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const pos = getCanvasPos(e);

      if (tool === "select" && selectedObject !== null && selectedObject >= 0) {
        const newObjects = [...objects];
        const obj = newObjects[selectedObject];
        if (!startPos) return;

        if (resizeHandle !== null) {
          // Handle resizing
          const { x: bx, y: by, width: bw, height: bh } = obj.bounds;
          const dx = pos.x - startPos.x;
          const dy = pos.y - startPos.y;
          let newBounds = { ...obj.bounds };

          // Update bounds based on handle
          switch (resizeHandle) {
            case 0: // Top-left
              newBounds.x += dx;
              newBounds.y += dy;
              newBounds.width -= dx;
              newBounds.height -= dy;
              break;
            case 1: // Top-middle
              newBounds.y += dy;
              newBounds.height -= dy;
              break;
            case 2: // Top-right
              newBounds.width += dx;
              newBounds.y += dy;
              newBounds.height -= dy;
              break;
            case 3: // Middle-left
              newBounds.x += dx;
              newBounds.width -= dx;
              break;
            case 4: // Middle-right
              newBounds.width += dx;
              break;
            case 5: // Bottom-left
              newBounds.x += dx;
              newBounds.width -= dx;
              newBounds.height += dy;
              break;
            case 6: // Bottom-middle
              newBounds.height += dy;
              break;
            case 7: // Bottom-right
              newBounds.width += dx;
              newBounds.height += dy;
              break;
            default:
              break;
          }

          // Adjust for negative widths/heights
          if (newBounds.width < 0) {
            newBounds.x += newBounds.width;
            newBounds.width = Math.abs(newBounds.width);
          }

          if (newBounds.height < 0) {
            newBounds.y += newBounds.height;
            newBounds.height = Math.abs(newBounds.height);
          }

          // Update object bounds and transform points accordingly
          if (obj.type === "line") {
            // For lines, scale all points proportionally
            const scaleX = bw !== 0 ? newBounds.width / bw : 1;
            const scaleY = bh !== 0 ? newBounds.height / bh : 1;

            obj.points = obj.points.map((point) => ({
              x: newBounds.x + (point.x - bx) * scaleX,
              y: newBounds.y + (point.y - by) * scaleY,
            }));
          } else if (obj.type === "circle") {
            // For circles, adjust the circumference point based on new bounds
            const centerX = newBounds.x + newBounds.width / 2;
            const centerY = newBounds.y + newBounds.height / 2;
            const radius = Math.max(newBounds.width, newBounds.height) / 2;
            obj.points[0] = { x: centerX, y: centerY };
            obj.points[1] = { x: centerX + radius, y: centerY };
          } else if (obj.type === "rect" || obj.type === "arrow") {
            // For rectangles and arrows, adjust start and/or end points based on handle
            switch (resizeHandle) {
              case 0: // Top-left
                obj.points[0] = { x: newBounds.x, y: newBounds.y };
                obj.points[1] = {
                  x: newBounds.x + newBounds.width,
                  y: newBounds.y + newBounds.height,
                };
                break;
              case 1: // Top-middle
                obj.points[0].y = newBounds.y;
                obj.points[1].y = newBounds.y + newBounds.height;
                break;
              case 2: // Top-right
                obj.points[0].y = newBounds.y;
                obj.points[1] = {
                  x: newBounds.x + newBounds.width,
                  y: newBounds.y + newBounds.height,
                };
                break;
              case 3: // Middle-left
                obj.points[0].x = newBounds.x;
                obj.points[1].x = newBounds.x + newBounds.width;
                break;
              case 4: // Middle-right
                obj.points[1].x = newBounds.x + newBounds.width;
                break;
              case 5: // Bottom-left
                obj.points[0].x = newBounds.x;
                obj.points[1].y = newBounds.y + newBounds.height;
                break;
              case 6: // Bottom-middle
                obj.points[1].y = newBounds.y + newBounds.height;
                break;
              case 7: // Bottom-right
                obj.points[1] = {
                  x: newBounds.x + newBounds.width,
                  y: newBounds.y + newBounds.height,
                };
                break;
              default:
                break;
            }
          }

          obj.bounds = newBounds;
          setObjects(newObjects);
          setStartPos(pos);
          return;
        } else {
          // Handle moving
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
      }

      if (tool !== "select") {
        const newObjects = [...objects];
        const currentObject = newObjects[newObjects.length - 1];

        if (!currentObject) return;

        if (tool === "brush") {
          currentObject.points.push(pos);
        } else if (startPos) {
          currentObject.points = [startPos, pos];
        }

        currentObject.bounds = calculateBounds(
          currentObject.points,
          currentObject.strokeWidth
        );
        setObjects(newObjects);
      }
    };

    // Handle mouse up event
    const handleMouseUp = () => {
      if (isDrawing) {
        addToHistory([...objects]);
      }
      setIsDrawing(false);
      setResizeHandle(null);

      // Do not select the object immediately after drawing
      if (tool !== "select") {
        const newObjects = objects.map((obj) => ({ ...obj, selected: false }));
        setObjects(newObjects);
        setSelectedObject(null);
      }
    };

    /**
     * Draws all objects and the background image on the canvas.
     */
    const drawObjects = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the background image if it exists
      if (backgroundImage) {
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = backgroundImage.width / backgroundImage.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imageAspect > canvasAspect) {
          drawHeight = canvas.width / imageAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imageAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
      }

      // Draw all user-drawn objects
      objects.forEach((obj) => {
        ctx.beginPath();
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth;

        switch (obj.type) {
          case "line":
            drawLine(ctx, obj);
            break;
          case "circle":
            drawCircle(ctx, obj);
            break;
          case "arrow":
            drawArrow(ctx, obj);
            break;
          case "rect":
            drawRect(ctx, obj);
            break;
        }

        if (obj.selected) {
          drawSelectionBox(ctx, obj);
        }
      });
    };

    // Draw a line
    const drawLine = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      if (obj.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(obj.points[0].x, obj.points[0].y);
      obj.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    };

    // Draw a circle
    const drawCircle = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      if (obj.points.length < 2) return;
      const [center, circumference] = obj.points;
      if (!center || !circumference) return;
      const radius = Math.hypot(
        circumference.x - center.x,
        circumference.y - center.y
      );
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    // Draw a rectangle
    const drawRect = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      if (obj.points.length < 2) return;
      const [start, end] = obj.points;
      if (!start || !end) return;
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    };

    // Draw an arrow
    const drawArrow = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      if (obj.points.length < 2) return;
      const [start, end] = obj.points;
      if (!start || !end) return;

      const headLen = 20;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.moveTo(
        end.x - headLen * Math.cos(angle - Math.PI / 6),
        end.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle + Math.PI / 6),
        end.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    };

    // Draw the selection box with resize handles
    const drawSelectionBox = (
      ctx: CanvasRenderingContext2D,
      obj: DrawingObject
    ) => {
      const { x, y, width, height } = obj.bounds;

      // Draw the selection rectangle
      ctx.save();
      ctx.setLineDash([4, 2]);
      ctx.strokeStyle = "#1E90FF"; // Dodger Blue color
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      ctx.restore();

      // Draw the resize handles
      const handleSize = 8;
      const half = handleSize / 2;

      const handles = [
        { x: x, y: y }, // Top-left
        { x: x + width / 2, y: y }, // Top-middle
        { x: x + width, y: y }, // Top-right
        { x: x, y: y + height / 2 }, // Middle-left
        { x: x + width, y: y + height / 2 }, // Middle-right
        { x: x, y: y + height }, // Bottom-left
        { x: x + width / 2, y: y + height }, // Bottom-middle
        { x: x + width, y: y + height }, // Bottom-right
      ];

      ctx.fillStyle = "#FFFFFF"; // White color for handles
      ctx.strokeStyle = "#000000"; // Black border for handles
      ctx.lineWidth = 1;

      handles.forEach((handle) => {
        ctx.fillRect(handle.x - half, handle.y - half, handleSize, handleSize);
        ctx.strokeRect(
          handle.x - half,
          handle.y - half,
          handleSize,
          handleSize
        );
      });
    };

    // Get which handle is being interacted with
    const getHandleAtPosition = (
      pos: { x: number; y: number },
      obj: DrawingObject
    ): number | null => {
      const { x, y, width, height } = obj.bounds;
      const handleSize = 8;
      const half = handleSize / 2;

      const handles = [
        { x: x, y: y }, // 0: Top-left
        { x: x + width / 2, y: y }, // 1: Top-middle
        { x: x + width, y: y }, // 2: Top-right
        { x: x, y: y + height / 2 }, // 3: Middle-left
        { x: x + width, y: y + height / 2 }, // 4: Middle-right
        { x: x, y: y + height }, // 5: Bottom-left
        { x: x + width / 2, y: y + height }, // 6: Bottom-middle
        { x: x + width, y: y + height }, // 7: Bottom-right
      ];

      for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        if (
          pos.x >= handle.x - half &&
          pos.x <= handle.x + half &&
          pos.y >= handle.y - half &&
          pos.y <= handle.y + half
        ) {
          return i;
        }
      }
      return null;
    };

    // Get mouse position relative to the canvas
    const getCanvasPos = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    // Redraw objects whenever they change
    useEffect(() => {
      drawObjects();
    }, [objects]);

    // Expose exportDrawing method to parent components
    useImperativeHandle(ref, () => ({
      exportDrawing: async () => {
        const canvas = canvasRef.current;
        if (canvas) {
          return canvas.toDataURL("image/png");
        }
        return "";
      },
    }));

    // Handle Delete Button Click
    const handleDelete = () => {
      if (selectedObject !== null && selectedObject >= 0) {
        const newObjects = objects.filter(
          (_, index) => index !== selectedObject
        );
        setObjects(newObjects);
        setSelectedObject(null);
        addToHistory(newObjects);
      }
    };

    // Handle Clear Canvas
    const handleClearCanvas = () => {
      if (objects.length > 0) {
        setObjects([]);
        setSelectedObject(null);
        addToHistory([]);
      }
    };

    // Handle Export Image
    const handleExportImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* Canvas Section */}
          <div className={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                border: "2px solid #e9ecef",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                cursor: tool === "select" ? "default" : "crosshair",
                width: "100%",
                height: "auto",
              }}
            />
          </div>

          {/* Controls Section */}
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              {/* Color Picker and Tool Selection */}
              <div className={styles.colorAndTools}>
                <div className={styles.colorPicker}>
                  <label className={styles.label}>Color:</label>
                  <HexColorPicker color={brushColor} onChange={setBrushColor} />
                </div>

                <div className={styles.toolsGroup}>
                  <div className={styles.tools}>
                    <button
                      className={`${styles.toolButton} ${
                        tool === "brush" ? styles.active : ""
                      }`}
                      onClick={() => setTool("brush")}
                      title="Brush Tool"
                    >
                      <Brush size={20} />
                    </button>
                    <button
                      className={`${styles.toolButton} ${
                        tool === "circle" ? styles.active : ""
                      }`}
                      onClick={() => setTool("circle")}
                      title="Circle Tool"
                    >
                      <Circle size={20} />
                    </button>
                    <button
                      className={`${styles.toolButton} ${
                        tool === "rect" ? styles.active : ""
                      }`}
                      onClick={() => setTool("rect")}
                      title="Rectangle Tool"
                    >
                      <Square size={20} />
                    </button>
                    <button
                      className={`${styles.toolButton} ${
                        tool === "select" ? styles.active : ""
                      }`}
                      onClick={() => setTool("select")}
                      title="Select Tool"
                    >
                      <Move size={20} />
                    </button>
                    <button
                      className={`${styles.toolButton} ${
                        tool === "eraser" ? styles.active : ""
                      }`}
                      onClick={() => setTool("eraser")}
                      title="Eraser Tool"
                    >
                      <Eraser size={20} />
                    </button>
                  </div>

                  <button
                    className={`${styles.deleteButton} ${
                      selectedObject === null ? styles.disabled : ""
                    }`}
                    onClick={handleDelete}
                    disabled={selectedObject === null}
                    title="Delete Selected Shape"
                  >
                    <Trash2 size={20} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Size Slider */}
              <div className={styles.sliderGroup}>
                <label className={styles.label}>Size:</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushRadius}
                  onChange={(e) => setBrushRadius(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.actionButton} ${styles.warning} ${
                    objects.length === 0 ? styles.disabled : ""
                  }`}
                  onClick={handleClearCanvas}
                  disabled={objects.length === 0}
                  title="Clear Canvas"
                >
                  <Trash size={20} />
                  Clear
                </button>

                <button
                  className={`${styles.actionButton} ${
                    historyIndex <= 0 ? styles.disabled : ""
                  }`}
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                >
                  <ArrowLeft size={20} />
                  Undo
                </button>

                <button
                  className={`${styles.actionButton} ${
                    historyIndex >= history.length - 1 ? styles.disabled : ""
                  }`}
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                >
                  <ArrowRight size={20} />
                  Redo
                </button>
              </div>

              {/* Export Button */}
              <button
                className={styles.exportButton}
                onClick={handleExportImage}
                title="Export Image"
              >
                <Download size={20} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
export default ArtBoard;
