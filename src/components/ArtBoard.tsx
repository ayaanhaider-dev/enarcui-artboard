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

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { HexColorPicker } from "react-colorful";
import { useCanvasEvents } from "../hooks/useCanvasEvents";
import { useCanvasHandlers } from "../hooks/useCanvasHandlers";
import styles from "../styles/ArtBoard.module.css";
import ActionButtons from "./Tools/ActionButtons";
import { Shapes } from "./Tools/Shapes";
import Slider from "./Tools/Slider";

/**
 * Represents a drawable object on the canvas.
 */
export interface DrawingObject {
  type: "brush" | "circle" | "arrow" | "rect" | "eraser";
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
  erased?: boolean; // Flag to mark if part of object is erased
  erasedPaths?: { x: number; y: number }[][];
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
  /**
   * Width of the drawing canvas in pixels.
   * Default: 800
   */
  width?: number;

  /**
   * Height of the drawing canvas in pixels.
   * Default: 600
   */
  height?: number;

  /**
   * Height of the controls area in pixels.
   * Allows you to control the vertical space allocated to tools and action buttons.
   * If contents exceed this height, it will become scrollable.
   * Default: 'auto' (no fixed height).
   */
  controlsHeight?: number | string;
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
 *         width={800}
 *         height={600}
 *         controlsHeight={600}
 *       />
 *       <button onClick={handleExport}>Export Drawing</button>
 *     </div>
 *   );
 * };
 *
 * export default App;
 */
const ArtBoard = forwardRef<ArtBoardRef, ArtBoardProps>(
  (
    { saveData, imageSrc, width = 800, height = 600, controlsHeight = "auto" },
    ref
  ) => {
    // Canvas reference
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    // State for drawable objects and user actions
    const [objects, setObjects] = useState<DrawingObject[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Tool state management
    const [tool, setTool] = useState<
      "brush" | "circle" | "arrow" | "rect" | "select" | "eraser"
    >("brush");
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushRadius, setBrushRadius] = useState(5);

    // Selection and history management
    const [selectedObject, setSelectedObject] = useState<number | null>(null);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
      null
    );
    const [resizeHandle, setResizeHandle] = useState<number | null>(null);

    const [history, setHistory] = useState<DrawingObject[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // State for the background image
    const [backgroundImage, setBackgroundImage] =
      useState<HTMLImageElement | null>(null);

    // Handlers for canvas interactions
    const { undo, redo, handleDelete, handleClearCanvas, handleExportImage } =
      useCanvasHandlers({
        canvasRef,
        objects,
        setObjects,
        setSelectedObject,
        selectedObject,
        setHistory,
        setHistoryIndex,
        history,
        historyIndex,
      });

    const {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    } = useCanvasEvents({
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
      addToHistory: (newObjects: DrawingObject[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, JSON.parse(JSON.stringify(newObjects))]);
        setHistoryIndex(historyIndex + 1);
      },
    });

    // Handle background image loading
    useEffect(() => {
      if (imageSrc) {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => setBackgroundImage(img);
        img.onerror = () => console.error("Failed to load image:", imageSrc);
      } else {
        setBackgroundImage(null);
      }
    }, [imageSrc]);

    // Draw objects and manage animation loop
    const drawObjects = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      }

      // Create temporary canvas for compositing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) return;

      objects.forEach((obj) => {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        if (obj.type === "eraser") {
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth;
        ctx.lineCap = "round";

        switch (obj.type) {
          case "brush":
          case "eraser":
            drawLine(ctx, obj);
            break;
          case "circle":
            drawCircle(tempCtx, obj);
            break;
          case "rect":
            drawRect(tempCtx, obj);
            break;
          case "arrow":
            drawArrow(tempCtx, obj);
            break;
        }
        if (obj.type === "eraser") {
          ctx.restore();
        }

        // Draw the result to main canvas
        ctx.drawImage(tempCanvas, 0, 0);
      });

      animationRef.current = requestAnimationFrame(drawObjects);
    }, [objects, backgroundImage, tool, isDrawing, brushRadius]);

    useEffect(() => {
      animationRef.current = requestAnimationFrame(drawObjects);
      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = null; // Reset animationRef to ensure it's properly cleaned up
      };
    }, [drawObjects]);

    // Canvas resizing on parent change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    }, [width, height]);
    // Base controls height for 100% scale
    const baseControlsHeight = 600;
    // Compute scale factor
    const scaleFactor = Number(controlsHeight) / baseControlsHeight;

    // Canvas interaction handlers
    const drawLine = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      if (obj.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(obj.points[0].x, obj.points[0].y);
      obj.points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    };

    const drawCircle = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      const [center, circumference] = obj.points;
      if (!center || !circumference) return;
      const radius = Math.hypot(
        center.x - circumference.x,
        center.y - circumference.y
      );
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    };

    const drawRect = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      const [start, end] = obj.points;
      if (!start || !end) return;
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    };

    const drawArrow = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
      const [start, end] = obj.points;
      if (!start || !end) return;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = 20;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle - Math.PI / 6),
        end.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle + Math.PI / 6),
        end.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    };

    // Export drawing to parent components
    useImperativeHandle(ref, () => ({
      exportDrawing: async () =>
        canvasRef.current?.toDataURL("image/png") || "",
    }));

    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* Canvas */}
          <div className={styles.canvasWrapper}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                border: "2px solid #e9ecef",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                cursor: tool === "select" ? "default" : "crosshair",
                width: width,
                height: height,
              }}
            />
          </div>

          {/* Controls */}
          <div
            className={styles.controls}
            style={{
              width: 300, // fixed width for the panel, adjust as needed
              height: controlsHeight,
              transform: `scale(${scaleFactor})`,
              transformOrigin: "top left",
              overflow: "hidden", // hides overflow since we're scaling the contents
            }}
          >
            <div className={styles.controlGroup}>
              <div className={styles.colorAndTools}>
                <label className={styles.label}>Color:</label>
                <HexColorPicker color={brushColor} onChange={setBrushColor} />
                <Shapes shape={tool} setShape={setTool} />
              </div>
              <Slider value={brushRadius} onChange={setBrushRadius} />
              <ActionButtons
                objectsLength={objects.length}
                selectedObject={selectedObject}
                historyIndex={historyIndex}
                historyLength={history.length}
                onClearCanvas={handleClearCanvas}
                onDelete={handleDelete}
                onUndo={undo}
                onRedo={redo}
                onExport={handleExportImage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ArtBoard;
