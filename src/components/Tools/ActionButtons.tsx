import { ArrowLeft, ArrowRight, Download, Trash, Trash2 } from "lucide-react";
import React from "react";
import styles from "../../styles/ActionButtons.module.css";

interface ActionButtonsProps {
  objectsLength: number;
  selectedObject: number | null;
  historyIndex: number;
  historyLength: number;
  onClearCanvas: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  objectsLength,
  selectedObject,
  historyIndex,
  historyLength,
  onClearCanvas,
  onDelete,
  onUndo,
  onRedo,
  onExport,
}) => {
  return (
    <>
      <div className={styles.actionButtons}>
        <button
          className={`${styles.actionButton} ${styles.warning} ${
            objectsLength === 0 ? styles.disabled : ""
          }`}
          onClick={onClearCanvas}
          disabled={objectsLength === 0}
          title="Clear Canvas"
        >
          <Trash size={20} />
          Clear
        </button>
        <button
          className={`${styles.actionButton} ${styles.warning} ${
            selectedObject === null ? styles.disabled : ""
          }`}
          onClick={onDelete}
          disabled={selectedObject === null}
          title="Delete Selected"
        >
          <Trash2 size={20} />
          Delete
        </button>
        <button
          className={`${styles.actionButton} ${
            historyIndex <= 0 ? styles.disabled : ""
          }`}
          onClick={onUndo}
          disabled={historyIndex <= 0}
          title="Undo"
        >
          <ArrowLeft size={20} />
          Undo
        </button>
        <button
          className={`${styles.actionButton} ${
            historyIndex >= historyLength - 1 ? styles.disabled : ""
          }`}
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
          title="Redo"
        >
          <ArrowRight size={20} />
          Redo
        </button>
      </div>
      <button
        className={styles.exportButton}
        onClick={onExport}
        title="Export Image"
      >
        <Download size={20} />
        Export
      </button>
    </>
  );
};

export default ActionButtons;
