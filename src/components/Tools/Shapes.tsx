import { ArrowRight, Brush, Circle, Eraser, Move, Square } from "lucide-react";
import styles from "../../styles/Shapes.module.css";

type ShapeType = "brush" | "circle" | "arrow" | "rect" | "select" | "eraser";

interface ShapesProps {
  shape: ShapeType;
  setShape: (shape: ShapeType) => void;
}

export const Shapes = ({ shape, setShape }: ShapesProps) => {
  return (
    <div className={styles.shapesGroup}>
      <div className={styles.shapes}>
        <button
          className={`${styles.shapeButton} ${
            shape === "brush" ? styles.active : ""
          }`}
          onClick={() => setShape("brush")}
          title="Brush Tool: Draw freehand shapes with adjustable size and color."
        >
          <Brush size={20} />
        </button>
        <button
          className={`${styles.shapeButton} ${
            shape === "circle" ? styles.active : ""
          }`}
          onClick={() => setShape("circle")}
          title="Circle Tool: Create perfect circular shapes."
        >
          <Circle size={20} />
        </button>
        <button
          className={`${styles.shapeButton} ${
            shape === "rect" ? styles.active : ""
          }`}
          onClick={() => setShape("rect")}
          title="Rectangle Tool: Draw rectangles with adjustable dimensions."
        >
          <Square size={20} />
        </button>
        <button
          className={`${styles.shapeButton} ${
            shape === "arrow" ? styles.active : ""
          }`}
          onClick={() => setShape("arrow")}
          title="Arrow Tool: Draw Arrow with adjustable dimensions."
        >
          <ArrowRight size={20} />
        </button>
        <button
          className={`${styles.shapeButton} ${
            shape === "select" ? styles.active : ""
          }`}
          onClick={() => setShape("select")}
          title="Select Tool: Move, resize, or delete shapes on the canvas."
        >
          <Move size={20} />
        </button>
        <button
          className={`${styles.shapeButton} ${
            shape === "eraser" ? styles.active : ""
          }`}
          onClick={() => setShape("eraser")}
          title="Eraser Tool: Remove shapes or parts of your drawing."
        >
          <Eraser size={20} />
        </button>
      </div>
    </div>
  );
};
