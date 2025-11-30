
'use client';

import { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, X, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Type, Shapes,
  ZoomIn, ZoomOut, Undo, Redo, Sun, Frame, Scissors,
  Wand2, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, Download, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdSlot } from '@/components/ad-slot';
import { useUser } from '@/firebase';
import {
  Paintbrush, Circle, Square, Star, Triangle, Heart, Hexagon,
  Image as ImageIconLucide, PictureInPicture, Loader2
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';


type EditorMode = 'adjust' | 'transform' | 'crop' | 'text' | 'shapes';
type Crop = { x: number; y: number; width: number; height: number };
type DragHandle = 'topLeft' | 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'move';
type Position = 'topLeft' | 'topCenter' | 'topRight' | 'centerLeft' | 'center' | 'centerRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';


// Data types for canvas objects
type TextObject = {
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  color: string;
  font: string;
  size: number;
  rotation: number;
  shadowColor: string;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
};

type ShapeObject = {
  id: number;
  type: 'shape';
  shape: 'rect' | 'circle' | 'triangle' | 'star' | 'heart' | 'hexagon';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  shadowColor: string;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
};

type ImageObject = {
  id: number;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  shadowColor: string;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
  imgElement?: HTMLImageElement;
}

type CanvasObject = TextObject | ShapeObject | ImageObject;

interface EditorState {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  'hue-rotate': number;
  blur: number;
  rotation: number;
  flip: { horizontal: boolean, vertical: boolean };
  objects: CanvasObject[];
}

const initialEditorState: EditorState = {
  brightness: 0,
  contrast: 0,
  saturate: 0,
  grayscale: 0,
  sepia: 0,
  'hue-rotate': 0,
  blur: 0,
  rotation: 0,
  flip: { horizontal: false, vertical: false },
  objects: [],
};

const aspectRatios = [
  { name: 'Freeform', value: undefined },
  { name: '1:1', value: 1 },
  { name: '4:3', value: 4 / 3 },
  { name: '3:4', value: 3 / 4 },
  { name: '16:9', value: 16 / 9 },
  { name: '9:16', value: 9 / 16 },
]

const orderedPositions: Position[] = [
  'topLeft', 'topCenter', 'topRight',
  'centerLeft', 'center', 'centerRight',
  'bottomLeft', 'bottomCenter', 'bottomRight'
];

const positionIcons: { [key in Position]: React.ElementType } = {
  topLeft: AlignStartVertical,
  topCenter: AlignCenterVertical,
  topRight: AlignEndVertical,
  centerLeft: AlignStartHorizontal,
  center: AlignCenterHorizontal,
  centerRight: AlignEndHorizontal,
  bottomLeft: AlignStartVertical,
  bottomCenter: AlignCenterVertical,
  bottomRight: AlignEndVertical,
};


type Action =
  | { type: 'SET_FILTER', payload: { filter: keyof Omit<EditorState, 'rotation' | 'flip' | 'objects'>, value: number } }
  | { type: 'SET_ROTATION', payload: number }
  | { type: 'SET_FLIP', payload: { horizontal?: boolean, vertical?: boolean } }
  | { type: 'ADD_OBJECT', payload: CanvasObject }
  | { type: 'UPDATE_OBJECT', payload: { id: number, updates: Partial<CanvasObject> } }
  | { type: 'REMOVE_OBJECT', payload: number }
  | { type: 'RESET' };

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.payload.filter]: action.payload.value };
    case 'SET_ROTATION':
      return { ...state, rotation: action.payload };
    case 'SET_FLIP':
      return { ...state, flip: { ...state.flip, ...action.payload } };
    case 'ADD_OBJECT':
      return { ...state, objects: [...state.objects, action.payload] };
    case 'UPDATE_OBJECT':
      return { ...state, objects: state.objects.map(obj => obj.id === action.payload.id ? { ...obj, ...action.payload.updates } : obj) };
    case 'REMOVE_OBJECT':
      return { ...state, objects: state.objects.filter(obj => obj.id !== action.payload) };
    case 'RESET':
      return { ...initialEditorState, objects: [] }; // Keep objects on reset
    default:
      return state;
  }
}

const fonts = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Impact'];
const shapeTypes: ShapeObject['shape'][] = ['rect', 'circle', 'triangle', 'star', 'heart', 'hexagon'];

export default function PhotoEditorPage() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pipInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [mode, setMode] = useState<EditorMode>('adjust');

  const [history, setHistory] = useState<EditorState[]>([initialEditorState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const { user } = useUser();
  const currentState = history[historyIndex];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const [isExporting, setIsExporting] = useState(false);

  const dispatchWithHistory = (action: Action) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const newState = editorReducer(currentState, action);
    setHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
  };

  const undo = () => {
    if (canUndo) setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (canRedo) setHistoryIndex(historyIndex + 1);
  };

  const [zoom, setZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const [activeObjectId, setActiveObjectId] = useState<number | null>(null);
  const [isDraggingObject, setIsDraggingObject] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeObject = currentState.objects.find(obj => obj.id === activeObjectId) || null;

  // Crop state
  const cropperRef = useRef<ReactCropperElement>(null);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - width / 2, y + (height + topCurveHeight) / 2, x, y + (height + topCurveHeight) / 2, x, y + height);
    ctx.bezierCurveTo(x, y + (height + topCurveHeight) / 2, x + width / 2, y + (height + topCurveHeight) / 2, x + width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
  }

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(x + radius * Math.cos(Math.PI / 3 * i), y + radius * Math.sin(Math.PI / 3 * i));
    }
    ctx.closePath();
  }

  const applyCanvasChanges = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !image) return;

    try {
      const img = await createImage(image);
      const { rotation, flip, objects } = currentState;

      canvas.width = img.width;
      canvas.height = img.height;

      const filterString = Object.entries(currentState)
        .filter(([key]) => !['rotation', 'flip', 'objects'].includes(key))
        .map(([key, value]) => {
          if (key === 'brightness' || key === 'contrast' || key === 'saturate') return `${key}(${100 + value}%)`;
          if (key === 'hue-rotate') return `hue-rotate(${value}deg)`;
          if (key === 'blur') return `blur(${value}px)`;
          if (key === 'grayscale' || key === 'sepia') return `${key}(${value}%)`;
          return '';
        })
        .join(' ');

      ctx.filter = filterString;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      ctx.filter = 'none';

      for (const obj of objects) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation * Math.PI / 180);

        if (obj.type === 'image') ctx.globalAlpha = obj.opacity / 100;

        if (obj.shadowBlur > 0) {
          ctx.shadowColor = obj.shadowColor;
          ctx.shadowBlur = obj.shadowBlur;
        }
        if (obj.strokeWidth > 0) {
          ctx.strokeStyle = obj.strokeColor;
          ctx.lineWidth = obj.strokeWidth;
        }

        if (obj.type === 'text') {
          ctx.fillStyle = obj.color;
          ctx.font = `${obj.size}px ${obj.font}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (obj.strokeWidth > 0) ctx.strokeText(obj.content, 0, 0);
          ctx.fillText(obj.content, 0, 0);
        } else if (obj.type === 'shape') {
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          if (obj.shape === 'rect') ctx.rect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
          else if (obj.shape === 'circle') ctx.arc(0, 0, obj.width / 2, 0, 2 * Math.PI);
          else if (obj.shape === 'triangle') {
            ctx.moveTo(0, -obj.height / 2);
            ctx.lineTo(-obj.width / 2, obj.height / 2);
            ctx.lineTo(obj.width / 2, obj.height / 2);
            ctx.closePath();
          } else if (obj.shape === 'star') drawStar(ctx, 0, 0, 5, obj.width / 2, obj.width / 4);
          else if (obj.shape === 'heart') drawHeart(ctx, 0, -obj.height / 4, obj.width, obj.height);
          else if (obj.shape === 'hexagon') drawHexagon(ctx, 0, 0, obj.width / 2);

          ctx.fill();
          if (obj.strokeWidth > 0) ctx.stroke();
        } else if (obj.type === 'image' && obj.imgElement) {
          ctx.drawImage(obj.imgElement, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
          if (obj.strokeWidth > 0) ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
        }
        ctx.restore();
      }
    } catch (e) {
      console.error("Canvas drawing failed:", e);
    }
  }, [currentState, image]);

  useEffect(() => {
    applyCanvasChanges();
  }, [applyCanvasChanges]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please upload an image.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        sessionStorage.setItem('photo-editor-image', imageUrl);
        setImage(imageUrl);
        const img = new window.Image();
        img.src = imageUrl;
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          const container = imageContainerRef.current;
          if (container) {
            const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
            const containerRatio = containerWidth / containerHeight;
            const imageRatio = img.width / img.height;

            let imgDisplayWidth, imgDisplayHeight;

            if (imageRatio > containerRatio) {
              imgDisplayWidth = containerWidth;
              imgDisplayHeight = containerWidth / imageRatio;
            } else {
              imgDisplayHeight = containerHeight;
              imgDisplayWidth = containerHeight * imageRatio;
            }

            // React-cropper handles initial crop automatically
            // setCrop({ x: cropXPercent, y: cropYPercent, width: cropWidthPercent, height: cropHeightPercent });
          }
        };
        router.refresh();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
      sessionStorage.setItem('download-image', dataUrl);
      sessionStorage.setItem('download-filename', 'dorex-ai-edited.jpg');
      router.push('/download');
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not export image.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    const newHistory = [initialEditorState];
    setHistory(newHistory);
    setHistoryIndex(0);
  }

  const handleExit = () => {
    sessionStorage.removeItem('photo-editor-image');
    setImage(null);
    handleReset();
    setHistory([initialEditorState]);
    setHistoryIndex(0);
    router.refresh();
  }

  const addObject = (type: 'text' | 'shape' | 'image', shapeType?: ShapeObject['shape'], imageSrc?: string) => {
    const common = {
      id: Date.now(),
      x: imageDimensions.width / 2,
      y: imageDimensions.height / 2,
      rotation: 0
    };
    let newObject: CanvasObject;
    if (type === 'text') {
      newObject = { ...common, type: 'text', content: 'New Text', color: '#ffffff', size: 48, font: 'Arial', shadowColor: '#000000', shadowBlur: 0, strokeColor: '#000000', strokeWidth: 0 };
      dispatchWithHistory({ type: 'ADD_OBJECT', payload: newObject });
      setActiveObjectId(newObject.id);
    } else if (type === 'image' && imageSrc) {
      createImage(imageSrc).then(img => {
        const aspectRatio = img.width / img.height;
        const newWidth = imageDimensions.width * 0.3;
        const newHeight = newWidth / aspectRatio;
        const imageObject: ImageObject = {
          ...common,
          type: 'image',
          src: imageSrc,
          width: newWidth,
          height: newHeight,
          opacity: 100,
          shadowColor: '#000000',
          shadowBlur: 0,
          strokeColor: '#000000',
          strokeWidth: 0,
          imgElement: img
        };
        dispatchWithHistory({ type: 'ADD_OBJECT', payload: imageObject });
        setActiveObjectId(imageObject.id);
      });
    } else {
      newObject = { ...common, type: 'shape', shape: shapeType || 'rect', width: 100, height: 100, color: '#3b82f6', shadowColor: '#000000', shadowBlur: 0, strokeColor: '#000000', strokeWidth: 0 };
      dispatchWithHistory({ type: 'ADD_OBJECT', payload: newObject });
      setActiveObjectId(newObject.id);
    }
  }

  const updateObject = (id: number, updates: Partial<CanvasObject>) => {
    dispatchWithHistory({ type: 'UPDATE_OBJECT', payload: { id, updates } });
  }

  // Canvas interaction for dragging objects
  const getObjectAtPosition = (x: number, y: number) => {
    // Reverse to check top-most object first
    for (const obj of [...currentState.objects].reverse()) {
      const width = obj.type === 'text' ? obj.content.length * (obj.size / 2) : obj.width;
      const height = obj.type === 'text' ? obj.size : obj.height;
      if (x >= obj.x - width / 2 && x <= obj.x + width / 2 && y >= obj.y - height / 2 && y <= obj.y + height / 2) {
        return obj;
      }
    }
    return null;
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const clickedObject = getObjectAtPosition(x, y);
    if (clickedObject) {
      setActiveObjectId(clickedObject.id);
      setIsDraggingObject(clickedObject.id);
      setDragStart({ x: x - clickedObject.x, y: y - clickedObject.y });
    } else {
      setActiveObjectId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingObject === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    updateObject(isDraggingObject, { x: x - dragStart.x, y: y - dragStart.y });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingObject(null);
  };

  const handlePipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please upload an image.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        addObject('image', undefined, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  const setPosition = (position: Position) => {
    if (!activeObject) return;

    let { x, y } = { ...activeObject };
    const margin = 0.05; // 5% margin
    const width = activeObject.type === 'text' ? activeObject.content.length * (activeObject.size / 2) : activeObject.width;
    const height = activeObject.type === 'text' ? activeObject.size : activeObject.height;

    if (position.includes('top')) y = height / 2 + imageDimensions.height * margin;
    if (position.includes('center')) y = imageDimensions.height / 2;
    if (position.includes('bottom')) y = imageDimensions.height - height / 2 - imageDimensions.height * margin;

    if (position.includes('Left')) x = width / 2 + imageDimensions.width * margin;
    if (position.includes('Center')) x = imageDimensions.width / 2;
    if (position.includes('Right')) x = imageDimensions.width - width / 2 - imageDimensions.width * margin;

    updateObject(activeObject.id, { x, y });
  }

  const AdjustPanel = () => {
    const filters = [
      { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100, default: 0 },
      { key: 'saturate', label: 'Saturate', min: -100, max: 100, default: 0 },
      { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, default: 0 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100, default: 0 },
      { key: 'hue-rotate', label: 'Hue Rotate', min: 0, max: 360, default: 0 },
      { key: 'blur', label: 'Blur', min: 0, max: 20, default: 0, step: 0.1 },
    ];

    const [tempValues, setTempValues] = useState<Partial<EditorState>>(() => {
      const initialValues: Partial<EditorState> = {};
      filters.forEach(filter => {
        initialValues[filter.key as keyof EditorState] = currentState[filter.key as keyof EditorState] as number;
      });
      return initialValues;
    });

    useEffect(() => {
      const currentFilters: Partial<EditorState> = {};
      filters.forEach(filter => {
        currentFilters[filter.key as keyof EditorState] = currentState[filter.key as keyof EditorState] as number;
      });
      setTempValues(currentFilters);
    }, [currentState]);


    const handleSliderChange = (key: keyof EditorState, value: number) => {
      setTempValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSliderCommit = (key: keyof EditorState, value: number) => {
      dispatchWithHistory({ type: 'SET_FILTER', payload: { filter: key as any, value: value } });
    };

    return (
      <Card className="w-full">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold px-2">Adjustments</h3>
          {filters.map(({ key, label, min, max, step }) => {
            const value = tempValues[key as keyof EditorState] as number ?? currentState[key as keyof EditorState] as number;
            return (
              <div key={key} className="space-y-2 px-2">
                <div className="flex justify-between items-center text-sm">
                  <Label className="capitalize">{label}</Label>
                  <span>{Math.round(value)}</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([val]) => handleSliderChange(key as keyof EditorState, val)}
                  onValueCommit={([val]) => handleSliderCommit(key as keyof EditorState, val)}
                  min={min}
                  max={max}
                  step={step || 1}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    );
  };


  const TransformPanel = () => (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-semibold px-2">Transform</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => dispatchWithHistory({ type: 'SET_ROTATION', payload: currentState.rotation - 90 })}><RotateCcw className="mr-2" /> Rotate Left</Button>
          <Button variant="outline" onClick={() => dispatchWithHistory({ type: 'SET_ROTATION', payload: currentState.rotation + 90 })}><RotateCw className="mr-2" /> Rotate Right</Button>
          <Button variant="outline" onClick={() => dispatchWithHistory({ type: 'SET_FLIP', payload: { horizontal: !currentState.flip.horizontal } })}><FlipHorizontal className="mr-2" /> Flip Horiz.</Button>
          <Button variant="outline" onClick={() => dispatchWithHistory({ type: 'SET_FLIP', payload: { vertical: !currentState.flip.vertical } })}><FlipVertical className="mr-2" /> Flip Vert.</Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleApplyCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (!croppedCanvas) return;

      const newImage = croppedCanvas.toDataURL();
      setImage(newImage);
      setImageDimensions({ width: croppedCanvas.width, height: croppedCanvas.height });
      setMode('adjust');
      toast({ title: 'Crop Applied', description: 'You can now continue editing.' });
    }
  };

  const CropPanel = () => {
    const handleSetCropAspect = (newAspect: number | undefined) => {
      setCropAspect(newAspect);
      if (cropperRef.current && cropperRef.current.cropper) {
        cropperRef.current.cropper.setAspectRatio(newAspect || NaN);
      }
    }

    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold px-2">Crop</h3>
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <div className="grid grid-cols-2 gap-2">
              {aspectRatios.map(r => (
                <Button key={r.name} variant={cropAspect === r.value ? 'secondary' : 'outline'} onClick={() => handleSetCropAspect(r.value)}>{r.name}</Button>
              ))}
            </div>
          </div>
          <Button onClick={handleApplyCrop} className="w-full">Apply Crop</Button>
        </CardContent>
      </Card>
    );
  }

  const TextPanel = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <Button onClick={() => addObject('text')} className="w-full">Add Text</Button>
        {activeObject && activeObject.type === 'text' && (
          <div className="space-y-2">
            <Accordion type="multiple" defaultValue={['content', 'position']} className="w-full">
              <AccordionItem value="content">
                <AccordionTrigger>Content & Font</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Input
                    value={activeObject.content}
                    onChange={(e) => updateObject(activeObject.id, { content: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Font</Label>
                      <Select value={activeObject.font} onValueChange={(v) => updateObject(activeObject.id, { font: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{fonts.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Color</Label>
                      <Input type="color" value={activeObject.color} onChange={(e) => updateObject(activeObject.id, { color: e.target.value })} className="w-12 h-8 p-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Size: {activeObject.size}</Label>
                    <Slider value={[activeObject.size]} onValueChange={([val]) => updateObject(activeObject.id, { size: val })} min={8} max={512} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="position">
                <AccordionTrigger>Position & Transform</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Quick Position</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {orderedPositions.map(p => {
                        const Icon = positionIcons[p];
                        let extraClass = '';
                        if (p.includes('Right')) extraClass = 'transform rotate-90';
                        if (p.includes('Left')) extraClass = 'transform -rotate-90';
                        if (p.includes('bottom')) extraClass = 'transform rotate-180';
                        return (
                          <Button key={p} variant='outline' size="icon" onClick={() => setPosition(p)}>
                            <Icon className={cn("h-5 w-5", extraClass)} />
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rotation: {activeObject.rotation}°</Label>
                    <Slider value={[activeObject.rotation]} onValueChange={([v]) => updateObject(activeObject.id, { rotation: v })} min={-180} max={180} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="outline">
                <AccordionTrigger>Outline</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className='flex items-center gap-4'>
                    <Input type="color" value={activeObject.strokeColor} onChange={e => updateObject(activeObject.id, { strokeColor: e.target.value })} className='w-12 h-8 p-1' />
                    <div className="flex-1 space-y-2">
                      <Label>Width: {activeObject.strokeWidth}</Label>
                      <Slider value={[activeObject.strokeWidth]} onValueChange={([v]) => updateObject(activeObject.id, { strokeWidth: v })} max={20} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shadow">
                <AccordionTrigger>Shadow</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className='flex items-center gap-4'>
                    <Input type="color" value={activeObject.shadowColor} onChange={e => updateObject(activeObject.id, { shadowColor: e.target.value })} className='w-12 h-8 p-1' />
                    <div className="flex-1 space-y-2">
                      <Label>Blur: {activeObject.shadowBlur}</Label>
                      <Slider value={[activeObject.shadowBlur]} onValueChange={([v]) => updateObject(activeObject.id, { shadowBlur: v })} max={50} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button variant="destructive" onClick={() => dispatchWithHistory({ type: 'REMOVE_OBJECT', payload: activeObject.id })} className="w-full mt-4">Remove Text</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ShapesPanel = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Add Shape</h4>
          <div className="grid grid-cols-3 gap-2">
            {shapeTypes.map(shape => <Button key={shape} variant="outline" onClick={() => addObject('shape', shape)} className="capitalize">{shape}</Button>)}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Add Picture</h4>
          <input type="file" ref={pipInputRef} onChange={handlePipUpload} className="hidden" accept="image/*" />
          <Button variant="outline" onClick={() => pipInputRef.current?.click()} className="w-full">
            <PictureInPicture className="mr-2" />Upload Picture
          </Button>
        </div>

        {activeObject && (activeObject.type === 'shape' || activeObject.type === 'image') && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold capitalize">Edit {activeObject.type}</h4>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'><Label>Width</Label><Slider value={[activeObject.width]} onValueChange={([v]) => updateObject(activeObject.id, { width: v })} min={10} max={imageDimensions.width} /></div>
              <div className='space-y-2'><Label>Height</Label><Slider value={[activeObject.height]} onValueChange={([v]) => updateObject(activeObject.id, { height: v })} min={10} max={imageDimensions.height} /></div>
            </div>

            {activeObject.type === 'shape' && (
              <div className="flex items-center gap-2">
                <Label>Color</Label>
                <Input type="color" value={activeObject.color} onChange={(e) => updateObject(activeObject.id, { color: e.target.value })} className="w-12 h-8 p-1" />
              </div>
            )}
            {activeObject.type === 'image' && (
              <div className="space-y-2">
                <Label>Opacity: {activeObject.opacity}%</Label>
                <Slider value={[activeObject.opacity]} onValueChange={([v]) => updateObject(activeObject.id, { opacity: v })} min={0} max={100} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Rotation: {activeObject.rotation}°</Label>
              <Slider value={[activeObject.rotation]} onValueChange={([v]) => updateObject(activeObject.id, { rotation: v })} min={-180} max={180} />
            </div>
            <div className="space-y-2 border-t pt-2">
              <Label>Outline</Label>
              <div className='flex gap-2'><Input type="color" value={activeObject.strokeColor} onChange={e => updateObject(activeObject.id, { strokeColor: e.target.value })} className='w-12 h-8 p-1' /><Slider value={[activeObject.strokeWidth]} onValueChange={([v]) => updateObject(activeObject.id, { strokeWidth: v })} max={20} /></div>
            </div>
            <div className="space-y-2 border-t pt-2">
              <Label>Shadow</Label>
              <div className='flex gap-2'><Input type="color" value={activeObject.shadowColor} onChange={e => updateObject(activeObject.id, { shadowColor: e.target.value })} className='w-12 h-8 p-1' /><Slider value={[activeObject.shadowBlur]} onValueChange={([v]) => updateObject(activeObject.id, { shadowBlur: v })} max={50} /></div>
            </div>
            <Button variant="destructive" onClick={() => dispatchWithHistory({ type: 'REMOVE_OBJECT', payload: activeObject.id })}>Remove {activeObject.type}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderInspector = () => {
    switch (mode) {
      case 'adjust': return <AdjustPanel />;
      case 'transform': return <TransformPanel />;
      case 'crop': return <CropPanel />;
      case 'text': return <TextPanel />;
      case 'shapes': return <ShapesPanel />;
      default: return null;
    }
  }

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    const storedImage = sessionStorage.getItem('photo-editor-image');
    if (storedImage) {
      setImage(storedImage);
      createImage(storedImage).then(img => {
        setImageDimensions({ width: img.width, height: img.height });
      });
    }
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Editor...</p>
        </div>
      </div>
    );
  }

  // Fullscreen editor when image is loaded
  if (image) {

    return (
      <div className="w-full h-screen flex flex-col bg-muted/40">
        <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden" accept="image/*" />
        <header className="h-16 flex items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleExit}><X /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}><Undo /></Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}><Redo /></Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut /></Button>
            <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button onClick={handleDownload} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-16 border-r bg-background flex flex-col items-center py-4 gap-2">
            <Button variant={mode === 'adjust' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('adjust')}><Sun /></Button>
            <Button variant={mode === 'transform' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('transform')}><Frame /></Button>
            <Button variant={mode === 'crop' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('crop')}><Scissors /></Button>
            <Button variant={mode === 'text' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('text')}><Type /></Button>
            <Button variant={mode === 'shapes' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('shapes')}><Shapes /></Button>
          </aside>
          <main
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
          >
            <div
              ref={imageContainerRef}
              className="relative"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              style={{
                width: imageDimensions.width,
                height: imageDimensions.height,
                maxWidth: '100%',
                maxHeight: '100%',
                margin: 'auto',
                transform: `scale(${zoom})`,
                transformOrigin: 'center'
              }}
            >
              <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" style={{ width: '100%', height: '100%' }} />
              {currentState.objects.map(obj => {
                if (obj.id !== activeObjectId) return null;
                const width = obj.type === 'text' ? obj.content.length * (obj.size / 2) : obj.width;
                const height = obj.type === 'text' ? obj.size : obj.height;
                return (
                  <div key={obj.id} className="absolute border-2 border-dashed border-primary pointer-events-none" style={{
                    left: `${obj.x - width / 2}px`,
                    top: `${obj.y - height / 2}px`,
                    width: width,
                    height: height,
                  }}></div>
                )
              })}
              {mode === 'crop' && image && (
                <div className="absolute inset-0 z-50 bg-black">
                  <Cropper
                    src={image}
                    style={{ height: '100%', width: '100%' }}
                    initialAspectRatio={undefined}
                    aspectRatio={cropAspect}
                    guides={true}
                    ref={cropperRef}
                    viewMode={1}
                    dragMode="move"
                    scalable={true}
                    cropBoxMovable={true}
                    cropBoxResizable={true}
                    background={false}
                    responsive={true}
                    autoCropArea={0.8}
                    checkOrientation={false}
                  />
                </div>
              )}
            </div>
          </main>
          <aside className="w-80 border-l bg-background p-4 overflow-y-auto space-y-4">
            {renderInspector()}
            <AdSlot placement="editor_sidebar" className="w-full h-[250px] mt-auto" />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden" accept="image/*" />
        <Card className="w-full max-w-lg text-center"
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFileChange(e.dataTransfer.files) }}
        >
          <CardHeader>
            <CardTitle className="text-3xl">Photo Editor</CardTitle>
            <CardDescription>A full-featured editor for all your photo editing needs. Adjust colors, transform, add text, shapes, and more. Upload an image to get started.</CardDescription>
          </CardHeader>
          <CardContent className={cn("p-6 text-center w-full transition-colors", { 'bg-primary/10': false })}>
            <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Drag & drop your image here</h3>
              <p className="text-muted-foreground mt-2">or</p>
              <Button className="mt-4 pointer-events-none">
                <ImageIconLucide className="mr-2 h-4 w-4" /> Select Image
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="mt-16 space-y-8 max-w-4xl w-full">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">About the Photo Editor</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our comprehensive Photo Editor provides a full suite of tools to take your images to the next level. Unlike single-purpose tools, this editor is an all-in-one solution for detailed adjustments, creative transformations, and rich annotations. Whether you're a professional photographer touching up a shot or a social media manager creating content, you'll find everything you need right here.
                <br /><br />
                From basic adjustments like brightness and contrast to advanced features like adding text and shapes, this editor empowers you to realize your creative vision without leaving your browser.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">How to Use the Free Online Photo Editor</h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><span className="font-semibold text-foreground">Upload Your Image:</span> Start by dragging and dropping or selecting an image file from your device.</li>
                <li><span className="font-semibold text-foreground">Use the Editing Tools:</span> Use the side panels to navigate between different editing modes: Adjust, Transform, Text, and Shapes.</li>
                <li><span className="font-semibold text-foreground">Fine-Tune Your Edits:</span> Use the controls in the right-hand panel to precisely adjust each setting and element. Click on text or shapes on the canvas to select and edit them.</li>
                <li><span className="font-semibold text-foreground">Undo & Redo:</span> Don't worry about mistakes. Use the undo and redo buttons in the top toolbar to easily step backward or forward through your changes.</li>
                <li><span className="font-semibold text-foreground">Export Your Creation:</span> When you're finished, click "Export" to download your final edited image as a high-quality PNG file.</li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
