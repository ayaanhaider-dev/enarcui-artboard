# EnarcUI ArtBoard 🎨

[![npm version](https://badge.fury.io/js/%40enarcui%2Fartboard.svg)](https://badge.fury.io/js/%40enarcui%2Fartboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

A powerful and versatile React drawing component with advanced shape manipulation capabilities

## ✨ Features

- 🎨 **Rich Drawing Tools**

  - Freehand brush tool with adjustable size
  - Shape tools: Circle, Rectangle, Arrow
  - Selection tool for object manipulation
  - Eraser tool
  - Color picker with hex color support

- 🔄 **Advanced Object Manipulation**

  - Select and move objects freely
  - Resize objects using 8-point handles
  - Rotate objects (coming soon)
  - Delete selected objects
  - Clear entire canvas

- 📐 **Precise Controls**

  - Adjustable brush size (1-50px)
  - Custom color selection
  - Stroke width control
  - Snap to grid (coming soon)

- ⏮️ **History Management**

  - Unlimited undo/redo
  - Full drawing history
  - State persistence

- 💾 **Export Options**

  - Export as PNG image
  - Get base64 encoded data URL
  - Save/load drawing state

- 🖼️ **Background Support**
  - Load custom background images
  - Auto-scaling and centering
  - Maintain aspect ratio

## 🚀 Installation

```bash
npm install enarc-artboard
# or
yarn add enarc-artboard
```

## 📖 Basic Usage

```javascript
import React, { useRef } from "react";
import ArtBoard, { ArtBoardRef } from "enarc-artboard";

const App = () => {
  const artBoardRef = useRef < ArtBoardRef > null;

  const handleExport = async () => {
    const imageData = await artBoardRef.current?.exportDrawing();
    console.log(imageData);
  };

  return (
    <div>
      <ArtBoard
        ref={artBoardRef}
        saveData="existing-drawing-data" // Optional
        imageSrc="background.jpg" // Optional
      />
      <button onClick={handleExport}>Export Drawing</button>
    </div>
  );
};
```

## 🔧 Props

| Prop     | Type   | Required | Default   | Description                                      |
| -------- | ------ | -------- | --------- | ------------------------------------------------ |
| saveData | string | No       | undefined | Serialized drawing data to initialize the canvas |
| imageSrc | string | No       | undefined | Background image URL                             |
| width    | number | No       | 800       | Canvas width in pixels                           |
| height   | number | No       | 600       | Canvas height in pixels                          |

## 📚 API Reference

### Ref Methods

| Method          | Returns         | Description                           |
| --------------- | --------------- | ------------------------------------- |
| exportDrawing() | Promise<string> | Returns drawing as base64 encoded PNG |
| clear()         | void            | Clears the entire canvas              |
| undo()          | void            | Reverts last action                   |
| redo()          | void            | Reapplies last undone action          |

## 🛠️ Development

Prerequisites:

- Node.js >= 14
- npm >= 7

```bash
git clone https://github.com/yourusername/enarc-artboard
cd enarc-artboard
npm install
npm run dev
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch:

```bash
git checkout -b feature/YourFeature
```

3. Commit your changes:

```bash
git commit -m 'Add YourFeature'
```

4. Push to your branch:

```bash
git push origin feature/YourFeature
```

5. Submit a Pull Request

### Development Guidelines

- Write clean, documented TypeScript code
- Follow the existing code style and ESLint rules
- Add unit tests for new features
- Update documentation as needed
- Keep commits atomic and well-described
- Ensure all tests pass before submitting PR

### Setting Up Development Environment

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## License

Copyright (c) 2024 Enarc ArtBoard

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 🙏 Acknowledgments

Special thanks to:

- React team for the incredible framework
- Material-UI team for the component library
- All our contributors and community members
- The open source community for inspiration and support
