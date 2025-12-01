# Advanced Mockup Editor - Implementation Plan

## 🎯 Goal

Create an interactive drag-and-drop mockup editor where users can:

- Upload front and back designs
- Drag designs to position them on t-shirt mockups
- Adjust size, scale, and rotation
- See real-time preview
- Export/download final mockup

## 📋 Features Overview

### 1. Interactive Mockup Canvas

- **Front/Back Views**: Switch between front and back t-shirt mockups
- **Drop Zone**: Drag and drop design images directly onto mockup
- **Drag to Position**: Move design images around the mockup
- **Resize**: Scale design up/down
- **Rotation**: Rotate design if needed
- **Snap to Grid**: Optional grid snapping for alignment

### 2. Design Controls

- **Position**: X, Y coordinates
- **Scale**: Percentage (10% - 200%)
- **Rotation**: Degrees (0° - 360°)
- **Reset**: Reset to default position
- **Delete**: Remove design from mockup

### 3. Real-time Preview

- **Live Update**: See changes immediately
- **Full View**: Complete t-shirt with design
- **Zoom**: Zoom in/out for detail work
- **Download**: Export as PNG/JPG

### 4. User Experience

- **Touch Support**: Works on mobile/tablet
- **Keyboard Shortcuts**: For power users
- **Undo/Redo**: Step back changes
- **Save Draft**: Save work in progress

## 🏗️ Technical Architecture

### Components Structure

```
MockupEditor/
├── MockupCanvas.tsx          # Main canvas container
├── TShirtMockup.tsx          # T-shirt base image
├── DesignLayer.tsx           # Draggable design layer
├── ControlPanel.tsx          # Position/scale/rotation controls
├── Toolbar.tsx               # Tools (flip, reset, delete)
└── PreviewPanel.tsx          # Preview and export
```

### State Management

```typescript
interface DesignPosition {
  x: number; // X position on canvas
  y: number; // Y position on canvas
  scale: number; // Scale factor (0.1 - 2.0)
  rotation: number; // Rotation in degrees
  imageUrl: string; // Design image URL
  side: "front" | "back";
}
```

### Libraries Needed

- `react-draggable` or `react-dnd` - Drag and drop
- `fabric.js` or `konva.js` - Canvas manipulation (optional)
- `html2canvas` - Export canvas to image
- Or pure HTML5 Canvas API for lighter solution

## 📐 UI Layout

```
┌─────────────────────────────────────────────────────┐
│  [Front] [Back]  |  Upload Design  |  Download     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐     ┌──────────────────┐    │
│  │                  │     │  Controls        │    │
│  │  Mockup Canvas   │     │  X: [____]       │    │
│  │                  │     │  Y: [____]       │    │
│  │  [T-Shirt Base]  │     │  Scale: [===]    │    │
│  │                  │     │  Rotate: [⟳]     │    │
│  │  [Design Layer]  │     │                  │    │
│  │  (Draggable)     │     │  [Reset]         │    │
│  │                  │     │  [Delete]        │    │
│  └──────────────────┘     └──────────────────┘    │
│                                                     │
│  Preview: [Small Preview Image]                    │
└─────────────────────────────────────────────────────┘
```

## 🔄 User Flow

1. **Upload Design**

   - User clicks "Upload Front" or "Upload Back"
   - Image appears in drop zone
   - Drag image onto mockup canvas
   - Image snaps to center of mockup

2. **Position Design**

   - Click and drag design on canvas
   - Real-time position updates
   - See coordinates in control panel

3. **Adjust Size**

   - Use scale slider or drag handles
   - Maintain aspect ratio (optional)
   - Real-time preview

4. **Fine-tune**

   - Rotate if needed
   - Adjust exact position with input fields
   - Use snap-to-grid for alignment

5. **Preview & Export**
   - Switch between front/back views
   - See final mockup preview
   - Download as image
   - Proceed to order

## 🎨 Implementation Steps

### Phase 1: Basic Drag & Drop

- [ ] Create canvas container
- [ ] Add t-shirt base image
- [ ] Implement drag and drop for design image
- [ ] Basic positioning

### Phase 2: Interactive Controls

- [ ] Add scale controls
- [ ] Add rotation controls
- [ ] Position input fields
- [ ] Reset/delete buttons

### Phase 3: Preview & Export

- [ ] Real-time preview
- [ ] Generate final mockup image
- [ ] Download functionality
- [ ] Save configuration

### Phase 4: Polish

- [ ] Touch support for mobile
- [ ] Keyboard shortcuts
- [ ] Undo/redo
- [ ] Animations/transitions

## 🛠️ Technology Choices

### Option A: Pure HTML5 Canvas (Recommended)

- ✅ Lightweight
- ✅ Full control
- ✅ No extra dependencies
- ✅ Good performance

### Option B: Fabric.js

- ✅ Rich features
- ✅ Easy manipulation
- ❌ Larger bundle size
- ❌ More complex

### Option C: React-Draggable + Canvas

- ✅ Simple drag implementation
- ✅ Canvas for rendering
- ✅ Moderate complexity

**Recommendation: Option C (React-Draggable + Canvas)** - Best balance

## 📦 Packages to Install

```bash
npm install react-draggable
npm install html2canvas
npm install @types/react-draggable --save-dev
```

## 💾 Data Persistence

Save design position data:

```typescript
{
  front: {
    imageUrl: string,
    x: number,
    y: number,
    scale: number,
    rotation: number
  },
  back: {
    imageUrl: string,
    x: number,
    y: number,
    scale: number,
    rotation: number
  }
}
```

Store in:

- Component state (temporary)
- LocalStorage (draft save)
- Database (with order)

## 🎯 Success Criteria

- [ ] User can drag design onto mockup
- [ ] User can reposition design by dragging
- [ ] User can resize design
- [ ] Real-time preview works
- [ ] Download generates correct mockup
- [ ] Works on desktop and mobile
- [ ] Smooth performance

## 📝 Next Steps

1. Review and approve plan
2. Install required packages
3. Create base components
4. Implement drag and drop
5. Add controls
6. Implement export
7. Test and refine

---

**Ready to proceed with implementation?** This will significantly improve the user experience for custom design placement!
