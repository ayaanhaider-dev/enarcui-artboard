import React from "react";
import styles from "../../styles/Slider.module.css";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ value, onChange }) => {
  return (
    <div className={styles.sliderGroup}>
      <label className={styles.label}>Size:</label>
      <input
        type="range"
        min="1"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
    </div>
  );
};

export default Slider;
