'use client'

import { useState, useRef, Suspense, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Decal, useTexture, Text, PivotControls } from '@react-three/drei'
import { Shirt, Palette, Plus, RotateCcw, Type, ImageIcon, X, Move, MousePointer2, Trash2, Scissors, Sparkles, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import * as THREE from 'three'
import modelsData from '@/public/models/models.json'

// --- Constants ---
const ICON_MAP = {
  tshirt: Shirt,
  hoodie: Shirt,
  pants: Scissors
}

const PRODUCT_TYPES = Object.entries(modelsData.models).map(([id, model]) => ({
  id,
  name: model.name,
  icon: ICON_MAP[id as keyof typeof ICON_MAP] || Shirt,
  modelPath: model.path
}))

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#121212' },
  { name: 'Pink', value: '#FFB6C1' },
  { name: 'Blue', value: '#3B82F6' }
]

const FABRICS = [
  { id: 'cotton', name: 'Organic Cotton', desc: '100% Breathable Soft Cotton' },
  { id: 'fleece', name: 'Heavyweight Fleece', desc: '400GSM Cozy & Thick' },
  { id: 'linen', name: 'French Linen', desc: 'Lightweight Natural Weave' },
  { id: 'satin', name: 'Silk Satin', desc: 'Lustrous Smooth Finish' }
]

// --- Types ---
interface TextureElement {
  id: string
  type: 'image' | 'text'
  content: string // Text content or empty for image
  imageUrl?: string
  position: [number, number, number]
  baseRotation: [number, number, number]
  rotationAngle: number
  scale: [number, number, number]
  color?: string // For text
  fontSize?: number // For text logic
  opacity?: number // For controlling transparency
  meshName?: string // Associated mesh in GLTF model
}

// --- Helpers ---

// 1. Generate a texture from text string
function useTextTexture(text: string, color: string, fontSize: number = 100) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 1024)
      ctx.fillStyle = color
      const maxCharCount = Math.max(text.length, 6)
      const targetFontSize = Math.min(fontSize * 120, (1024 / maxCharCount) * 1.5)
      ctx.font = `bold ${targetFontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 512, 512)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [text, color, fontSize])
}

// 2. Component to render a single Decal (Image or Text)
function DecalItem({ 
  element, 
  isSelected, 
  onSelect,
  scaleMultiplier = [1, 1, 1]
}: { 
  element: TextureElement
  isSelected: boolean
  onSelect: (id: string) => void
  scaleMultiplier?: [number, number, number]
}) {
  // Handle image texture with error handling
  const imageTexture = useMemo(() => {
    if (element.type === 'image' && element.imageUrl) {
      try {
        return useTexture(element.imageUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
        });
      } catch (error) {
        console.error('Failed to load texture:', error);
        return null;
      }
    }
    return null;
  }, [element.type, element.imageUrl]);
  
  // Generate text texture
  const textTexture = useTextTexture(
    element.content || ' ', // Ensure at least a space for empty text
    element.color || '#000000',
    element.fontSize
  );
  
  // Choose texture based on type (Image vs Generated Text)
  const texture = element.type === 'text' ? textTexture : imageTexture || textTexture;

  const multiplier = scaleMultiplier || [1, 1, 1];
  const elemScale = element.scale || [0.3, 0.4, 0.1];

  // Keep X and Y scale from state, but force Z scale to be deep (e.g. 1.0) to prevent clipping on curved surfaces
  const decalScale: [number, number, number] = [
    (elemScale[0] ?? 0.3) * (multiplier[0] ?? 1),
    (elemScale[1] ?? 0.4) * (multiplier[1] ?? 1),
    Math.max((elemScale[2] ?? 0.1) * (multiplier[2] ?? 1), 0.8 * (multiplier[2] ?? 1))
  ];

  const baseRot = element.baseRotation || [0, 0, 0];
  const combinedRotation: [number, number, number] = [
    baseRot[0] || 0,
    baseRot[1] || 0,
    (baseRot[2] || 0) + (element.rotationAngle || 0)
  ];

  return (
    <Decal
      position={element.position}
      rotation={combinedRotation}
      scale={decalScale}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect(element.id)
      }}
    >
      <meshStandardMaterial 
        map={texture} 
        transparent 
        opacity={element.opacity ?? 1}
        side={THREE.FrontSide} // Only show on the outside
        polygonOffset 
        polygonOffsetFactor={-1}
        polygonOffsetUnits={1}
        roughness={0.8}
        metalness={0.2}
      />
    </Decal>
  )
}

// Helper to compute world scale of a node in raw GLTF hierarchy
const getMeshWorldScale = (node: any): [number, number, number] => {
  const scale = new THREE.Vector3(1, 1, 1);
  let current = node;
  while (current) {
    if (current.scale) {
      const sx = typeof current.scale.x === 'number' ? current.scale.x : (current.scale[0] ?? 1);
      const sy = typeof current.scale.y === 'number' ? current.scale.y : (current.scale[1] ?? 1);
      const sz = typeof current.scale.z === 'number' ? current.scale.z : (current.scale[2] ?? 1);
      scale.x *= sx;
      scale.y *= sy;
      scale.z *= sz;
    }
    current = current.parent;
  }
  return [scale.x, scale.y, scale.z];
};

// Recursive component to render GLTF nodes and attach Decals to meshes
function GLTFNode({ 
  node, 
  color, 
  textureElements, 
  selectedElementId, 
  onElementSelect,
  onElementUpdate
}: {
  node: any
  color: string
  textureElements: TextureElement[]
  selectedElementId: string | null
  onSelect?: any // Keep signature compatible
  onElementSelect: (id: string) => void
  onElementUpdate: (id: string, updates: Partial<TextureElement>) => void
}) {
  if (!node) return null

  if (node.isMesh) {
    const meshScale = getMeshWorldScale(node);
    const scaleMultiplier: [number, number, number] = [
      1 / (meshScale[0] || 1),
      1 / (meshScale[1] || 1),
      1 / (meshScale[2] || 1)
    ];

    return (
      <mesh
        key={node.uuid}
        name={node.name}
        geometry={node.geometry}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.2}
          envMapIntensity={0.8}
        />
        {/* Render decals directly as children of the mesh to satisfy Drei's parent-mesh constraint */}
        {textureElements
          .filter((el) => !el.meshName || el.meshName === node.name)
          .map((el) => (
            <DecalItem
              key={el.id}
              element={el}
              isSelected={selectedElementId === el.id}
              onSelect={onElementSelect}
              scaleMultiplier={scaleMultiplier}
            />
          ))}
        {/* Render PivotControls directly as children of the mesh (no wrapping group) to preserve tree structures */}
        {textureElements
          .filter((el) => selectedElementId === el.id && (!el.meshName || el.meshName === node.name))
          .map((el) => {
            const baseRot = el.baseRotation || [0, 0, 0];
            const combinedRotation: [number, number, number] = [
              baseRot[0],
              baseRot[1],
              baseRot[2] + (el.rotationAngle || 0)
            ];
            return (
              <PivotControls
                key={`pivot-${el.id}`}
                depthTest={false}
                scale={0.15}
                lineWidth={3}
                disableAxes={true}
                disableSliders={true}
                activeAxes={[false, false, true]}
                matrix={new THREE.Matrix4().compose(
                  new THREE.Vector3(...el.position),
                  new THREE.Quaternion().setFromEuler(new THREE.Euler(...combinedRotation)),
                  new THREE.Vector3(...scaleMultiplier)
                )}
                autoTransform={false}
                onDrag={(matrix) => {
                  const position = new THREE.Vector3();
                  const rotation = new THREE.Quaternion();
                  const scale = new THREE.Vector3();
                  matrix.decompose(position, rotation, scale);
                  const euler = new THREE.Euler().setFromQuaternion(rotation);
                  const baseZ = el.baseRotation ? el.baseRotation[2] : 0;
                  onElementUpdate(el.id, {
                    rotationAngle: euler.z - baseZ
                  });
                }}
              />
            )
          })}
      </mesh>
    )
  }

  if (node.isGroup || node.type === 'Object3D') {
    return (
      <group
        key={node.uuid}
        position={node.position}
        quaternion={node.quaternion}
        scale={node.scale}
      >
        {node.children.map((child: any, idx: number) => (
          <GLTFNode
            key={child.uuid || idx}
            node={child}
            color={color}
            textureElements={textureElements}
            selectedElementId={selectedElementId}
            onElementSelect={onElementSelect}
            onElementUpdate={onElementUpdate}
          />
        ))}
      </group>
    )
  }

  return null
}

// 3D Model loading the GLB files dynamically
function ProductModel({ 
  type, 
  color, 
  textureElements, 
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onLoad
}: { 
  type: string
  color: string
  textureElements: TextureElement[]
  selectedElementId: string | null
  onElementSelect: (id: string) => void
  onElementUpdate: (id: string, updates: Partial<TextureElement>) => void
  onLoad?: (scene: THREE.Group) => void
}) {
  const modelRef = useRef<THREE.Group>(null);
  const { camera, raycaster, pointer } = useThree();
  
  // Load model dynamically based on selected product type
  const modelConfig = (modelsData.models as any)[type];
  const modelPath = modelConfig?.path || `/models/tshirt.glb`;
  const { scene } = useGLTF(modelPath) as any;

  const baseScale = modelConfig?.scale ?? 1.0;
  const basePosition = (modelConfig?.position as [number, number, number]) ?? [0, 0, 0];
  const baseRotation = (modelConfig?.rotation as [number, number, number]) ?? [0, 0, 0];

  // Trigger onLoad callback
  useEffect(() => {
    if (scene && onLoad) {
      onLoad(scene);
    }
  }, [scene, onLoad]);

  // Raycasting for decal placement & local coordinates calculation
  const handlePointerMove = useCallback((e: any) => {
    if (!selectedElementId || !modelRef.current) return;
    if (e.buttons !== 1) return;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(modelRef.current, true);
    
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      if (hitMesh && hitMesh.isMesh) {
        const worldPoint = intersects[0].point;
        const worldNormal = intersects[0].normal;
        
        if (worldPoint && worldNormal) {
          const dummy = new THREE.Object3D();
          dummy.position.copy(worldPoint);
          dummy.lookAt(worldPoint.clone().add(worldNormal));
          dummy.updateMatrixWorld(true);
          
          hitMesh.updateMatrixWorld();
          const localMatrix = hitMesh.matrixWorld.clone().invert().multiply(dummy.matrixWorld);
          
          const localPos = new THREE.Vector3();
          const localQuad = new THREE.Quaternion();
          const localScale = new THREE.Vector3();
          localMatrix.decompose(localPos, localQuad, localScale);
          
          const localRot = new THREE.Euler().setFromQuaternion(localQuad);
          
          onElementUpdate(selectedElementId, {
            position: [localPos.x, localPos.y, localPos.z],
            baseRotation: [localRot.x, localRot.y, localRot.z],
            meshName: hitMesh.name
          });
        }
      }
    }
  }, [selectedElementId, camera, pointer, raycaster, onElementUpdate]);

  return (
    <group 
      ref={modelRef} 
      onPointerMove={handlePointerMove} 
      scale={[baseScale, baseScale, baseScale]}
      position={basePosition}
      rotation={baseRotation}
    >
      <GLTFNode
        node={scene}
        color={color}
        textureElements={textureElements}
        selectedElementId={selectedElementId}
        onElementSelect={onElementSelect}
        onElementUpdate={onElementUpdate}
      />
    </group>
  );
}

// Preload the GLTF models
Object.values(modelsData.models).forEach((model: any) => {
  useGLTF.preload(model.path)
})

// Helper to calculate exact surface coordinates using programmatical raycasting
const getSurfacePosition = (
  scene: THREE.Group,
  productType: string,
  designAreaKey: string
) => {
  const modelConfig = (modelsData.models as any)[productType];
  if (!modelConfig) return null;
  
  const area = modelConfig.designAreas[designAreaKey];
  if (!area) return null;
  
  const [defaultX, defaultY, defaultZ] = area.position;
  const isFront = defaultZ >= 0;
  
  const raycaster = new THREE.Raycaster();
  // Set origin way out in front or back of the shape
  const origin = new THREE.Vector3(defaultX, defaultY, isFront ? 5 : -5);
  const direction = new THREE.Vector3(0, 0, isFront ? -1 : 1);
  
  raycaster.set(origin, direction);
  
  // Update world matrices of the scene graph
  scene.updateMatrixWorld(true);
  const intersects = raycaster.intersectObject(scene, true);
  
  if (intersects.length > 0) {
    const hit = intersects[0];
    const hitMesh = hit.object as THREE.Mesh;
    const worldPoint = hit.point;
    const worldNormal = hit.normal;
    
    if (worldPoint && worldNormal) {
      const dummy = new THREE.Object3D();
      dummy.position.copy(worldPoint);
      dummy.lookAt(worldPoint.clone().add(worldNormal));
      dummy.updateMatrixWorld(true);
      
      hitMesh.updateMatrixWorld(true);
      const localMatrix = hitMesh.matrixWorld.clone().invert().multiply(dummy.matrixWorld);
      
      const localPos = new THREE.Vector3();
      const localQuad = new THREE.Quaternion();
      const localScale = new THREE.Vector3();
      localMatrix.decompose(localPos, localQuad, localScale);
      
      const localRot = new THREE.Euler().setFromQuaternion(localQuad);
      
      console.log("getSurfacePosition HIT:", hitMesh.name, "pos:", [localPos.x, localPos.y, localPos.z]);
      return {
        position: [localPos.x, localPos.y, localPos.z] as [number, number, number],
        baseRotation: [localRot.x, localRot.y, localRot.z] as [number, number, number],
        scale: area.scale as [number, number, number],
        meshName: hitMesh.name
      };
    }
  }
  
  // Find a fallback mesh name from the scene if raycast misses
  let fallbackMeshName: string | undefined = undefined;
  scene.traverse((child) => {
    if (!fallbackMeshName && child.type === 'Mesh') {
      fallbackMeshName = child.name;
    }
  });
  
  console.log("getSurfacePosition MISS. Fallback:", fallbackMeshName);
  // Fallback if no intersection
  return {
    position: area.position as [number, number, number],
    baseRotation: area.rotation as [number, number, number],
    scale: area.scale as [number, number, number],
    meshName: fallbackMeshName
  };
}

// Helper to retrieve the default design area parameters
const getDefaultDesignArea = (productType: string, designAreaKey: string) => {
  const modelConfig = (modelsData.models as any)[productType];
  if (!modelConfig) {
    return { 
      position: [0, 0.2, 0.1] as [number, number, number], 
      scale: [0.3, 0.4, 0.1] as [number, number, number], 
      rotation: [0, 0, 0] as [number, number, number] 
    };
  }
  
  const areaKey = designAreaKey in modelConfig.designAreas ? designAreaKey : Object.keys(modelConfig.designAreas)[0];
  const area = modelConfig.designAreas[areaKey];
  return {
    position: area.position as [number, number, number],
    scale: area.scale as [number, number, number],
    rotation: area.rotation as [number, number, number]
  };
}

// --- Main Page Component ---
export default function DesignPage() {
  const [selectedType, setSelectedType] = useState('tshirt')
  const selectedProductType = PRODUCT_TYPES.find(p => p.id === selectedType)
  const SelectedGarmentIcon = selectedProductType?.icon || Shirt
  const [selectedColor, setSelectedColor] = useState(COLORS[0]?.value || '#ffffff')
  const [textureElements, setTextureElements] = useState<TextureElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  
  // Model reference for raycasting
  const modelSceneRef = useRef<THREE.Group | null>(null)

  // Placement area state
  const [selectedArea, setSelectedArea] = useState('')
  
  const currentModelConfig = (modelsData.models as any)[selectedType]
  const availableDesignAreas = useMemo(() => {
    return currentModelConfig ? Object.keys(currentModelConfig.designAreas) : []
  }, [currentModelConfig])

  useEffect(() => {
    if (availableDesignAreas.length > 0) {
      setSelectedArea(availableDesignAreas[0])
    }
  }, [availableDesignAreas])

  // Form State
  const [selectedFabric, setSelectedFabric] = useState('cotton')
  const [activeLeftPanel, setActiveLeftPanel] = useState<'garment' | 'decoration' | null>('garment')
  const [isAdding, setIsAdding] = useState(false)
  const [newType, setNewType] = useState<'text'|'image'>('text')
  const [newContent, setNewContent] = useState('')
  const [newImage, setNewImage] = useState<string | null>(null)
  const [newColor, setNewColor] = useState('#000000')

  // Details & Publishing State
  const [designName, setDesignName] = useState('Custom Merch')
  const [designPrice, setDesignPrice] = useState(39.99)
  const [designDescription, setDesignDescription] = useState('Exclusive custom 3D merchandise design.')
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('Design published to your store!')
    } catch (err: any) {
      toast.error('Failed to publish design.')
    } finally {
      setIsPublishing(false)
    }
  }

  // --- Handlers ---
  const handleAddText = () => {
    if (!newContent.trim()) return;
    let designParams;
    if (modelSceneRef.current) {
      designParams = getSurfacePosition(modelSceneRef.current, selectedType, selectedArea || 'front');
    }
    
    if (!designParams) {
      const defaultDesign = getDefaultDesignArea(selectedType, selectedArea || 'front');
      designParams = {
        position: defaultDesign.position,
        baseRotation: defaultDesign.rotation,
        scale: defaultDesign.scale,
        meshName: undefined
      };
    }

    const newElement: TextureElement = {
      id: Date.now().toString(),
      type: 'text',
      content: newContent.trim(),
      position: designParams.position, 
      baseRotation: (designParams as any).baseRotation || [0, 0, 0],
      rotationAngle: 0,
      scale: designParams.scale,
      color: newColor,
      fontSize: 1,
      opacity: 1,
      meshName: designParams.meshName
    }
    setTextureElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)
    setNewContent('')
    toast.success('Text added to garment')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const imageUrl = ev.target?.result as string;
        if (!imageUrl) return;

        let designParams;
        if (modelSceneRef.current) {
          designParams = getSurfacePosition(modelSceneRef.current, selectedType, selectedArea || 'front');
        }
        
        if (!designParams) {
          const defaultDesign = getDefaultDesignArea(selectedType, selectedArea || 'front');
          designParams = {
            position: defaultDesign.position,
            baseRotation: defaultDesign.rotation,
            scale: defaultDesign.scale,
            meshName: undefined
          };
        }

        const newElement: TextureElement = {
          id: Date.now().toString(),
          type: 'image',
          content: 'Uploaded Graphic',
          imageUrl: imageUrl,
          position: designParams.position, 
          baseRotation: (designParams as any).baseRotation || [0, 0, 0],
          rotationAngle: 0,
          scale: designParams.scale,
          opacity: 1,
          meshName: designParams.meshName
        }
        setTextureElements(prev => [...prev, newElement])
        setSelectedElementId(newElement.id)
        toast.success('Image artwork uploaded')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateElement = (id: string, updates: Partial<TextureElement>) => {
    setTextureElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }
  
  // Specific handler for 3D dragging
  const handlePositionUpdate = (id: string, updates: Partial<TextureElement>) => {
    setTextureElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const selectedElement = textureElements.find(el => el.id === selectedElementId)

  return (
    <div className="relative min-h-screen bg-background text-foreground pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT & CENTER 2/3 COLUMN: 3D Model Viewport Canvas with Superimposed Floating Toolbar */}
        <div className="lg:col-span-8 h-[calc(100vh-130px)] min-h-[550px] glass-card-rounded overflow-hidden relative shadow-2xl border border-white/20">
          
          {/* Floating Vertical Customization Toolbar Superimposed on Top Left of 3D Canvas */}
          <div className="absolute top-4 left-4 z-20 flex gap-3 items-start pointer-events-auto">
            
            {/* Minimal Vertical Icon Toolbar */}
            <div className="flex flex-col gap-2 p-1.5 glass-pill shadow-2xl backdrop-blur-xl border border-white/20 items-center">
              <button
                onClick={() => setActiveLeftPanel(activeLeftPanel === 'garment' ? null : 'garment')}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                  activeLeftPanel === 'garment'
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                )}
                title={`${selectedProductType?.name || 'Garment'} & Fabric Settings`}
              >
                <div className="relative flex items-center justify-center">
                  <SelectedGarmentIcon className="w-4 h-4" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white/80 shadow-sm" style={{ backgroundColor: selectedColor }} />
                </div>
              </button>

              <button
                onClick={() => setActiveLeftPanel(activeLeftPanel === 'decoration' ? null : 'decoration')}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 relative group",
                  activeLeftPanel === 'decoration'
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                )}
                title="Add Artwork / Text"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Expandable Sub-Panels (Floats to the right of the vertical toolbar) */}
            <AnimatePresence mode="wait">
              {activeLeftPanel && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-72 sm:w-80 max-w-[calc(100vw-5rem)] bg-background/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-3.5 max-h-[calc(100vh-180px)] overflow-x-hidden overflow-y-auto space-y-3.5 box-border"
                >
                  {activeLeftPanel === 'garment' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1 border-b border-border/30">
                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Garment & Fabric</span>
                        <button onClick={() => setActiveLeftPanel(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Garment Style Icons */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Garment Style</label>
                          <span className="text-[10px] font-medium text-foreground">{selectedProductType?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {PRODUCT_TYPES.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedType(p.id)
                                setDesignName('Custom ' + p.name)
                              }}
                              className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 glass-pill relative group",
                                selectedType === p.id 
                                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                                  : "hover:bg-foreground/10 text-muted-foreground"
                              )}
                              title={p.name}
                            >
                              <p.icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fabric Material Selector */}
                      <div className="space-y-1.5 pt-1 border-t border-border/20">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fabric Material</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {FABRICS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => setSelectedFabric(f.id)}
                              className={cn(
                                "p-2 rounded-2xl text-left transition-all duration-200 glass text-xs",
                                selectedFabric === f.id
                                  ? "bg-primary/20 border-primary font-bold shadow-sm"
                                  : "hover:bg-foreground/10 text-muted-foreground border-transparent"
                              )}
                            >
                              <div className="text-[11px] font-bold text-foreground truncate">{f.name}</div>
                              <div className="text-[9px] text-muted-foreground truncate">{f.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fabric Color Swatches */}
                      <div className="space-y-1.5 pt-1 border-t border-border/20">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fabric Color</label>
                          <span className="text-[10px] font-medium text-foreground">{COLORS.find(c => c.value === selectedColor)?.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {COLORS.map(c => (
                            <button
                              key={c.value}
                              onClick={() => setSelectedColor(c.value)}
                              className={cn(
                                "w-7 h-7 rounded-full border border-white/40 transition-transform duration-200 hover:scale-110 shadow-sm flex items-center justify-center",
                                selectedColor === c.value && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                              )}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            >
                              {selectedColor === c.value && (
                                <div className={cn("w-1.5 h-1.5 rounded-full", c.value === '#FFFFFF' ? "bg-black" : "bg-white")} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeLeftPanel === 'decoration' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1 border-b border-border/30">
                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Artwork & Layers</span>
                        <button onClick={() => setActiveLeftPanel(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unified Form: Text Input + RGB Color Selector AND Image Upload Dropzone */}
                      <div className="space-y-3 glass p-3 rounded-2xl border border-white/20 box-border">
                        
                        {/* 1. Add Text Section */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Add Text Artwork</label>
                          <div className="flex items-center gap-1.5 w-full">
                            <input 
                              className="flex-1 min-w-0 px-3 py-1.5 rounded-full glass border border-white/20 bg-background/50 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                              placeholder="Type text artwork..." 
                              value={newContent} 
                              onChange={e => setNewContent(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddText();
                                }
                              }}
                            />
                            <button 
                              onClick={handleAddText} 
                              disabled={!newContent.trim()} 
                              className="btn-highlight px-3 py-1.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                              Add
                            </button>
                          </div>

                          {/* RGB Text Color Selector */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-muted-foreground">Text Color (RGB/Hex):</span>
                              <span className="text-[9px] font-mono font-medium text-foreground uppercase">{newColor}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full">
                              {/* Native RGB Color Picker Button */}
                              <div className="relative w-7 h-7 rounded-full border border-white/40 shadow-sm shrink-0 cursor-pointer overflow-hidden flex items-center justify-center group">
                                <input 
                                  type="color" 
                                  value={newColor} 
                                  onChange={e => setNewColor(e.target.value)}
                                  className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0 z-10"
                                  title="Open Full RGB Color Picker"
                                />
                                <div className="w-full h-full rounded-full transition-transform group-hover:scale-110" style={{ backgroundColor: newColor }} />
                              </div>

                              {/* Custom Hex Code Input */}
                              <input 
                                type="text" 
                                value={newColor} 
                                onChange={e => setNewColor(e.target.value)}
                                className="flex-1 min-w-0 px-3 py-1 rounded-full text-xs font-mono glass border border-white/20 uppercase text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-2 my-1">
                          <div className="flex-1 h-[1px] bg-border/30" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">OR</span>
                          <div className="flex-1 h-[1px] bg-border/30" />
                        </div>

                        {/* 2. Image Upload Dropzone */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Upload Image / Graphic</label>
                          <label className="border border-dashed border-white/30 rounded-2xl p-2.5 flex flex-col items-center justify-center cursor-pointer glass hover:bg-foreground/10 transition-all text-center gap-1 group">
                            <ImageIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-semibold text-foreground">Click to Upload Graphic</span>
                            <span className="text-[9px] text-muted-foreground">PNG, JPG, SVG supported</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        </div>
                      </div>

                      {/* Active Layers Stack */}
                      {textureElements.length > 0 && (
                        <div className="space-y-1">
                          <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Layers ({textureElements.length})</h3>
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                            {textureElements.map((el) => (
                              <div 
                                key={el.id}
                                onClick={() => setSelectedElementId(el.id)}
                                className={cn(
                                  "p-1.5 rounded-xl glass flex items-center justify-between cursor-pointer text-xs transition-all",
                                  selectedElementId === el.id ? "border-primary bg-primary/10 font-bold" : ""
                                )}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {el.type === 'text' ? <Type className="w-3 h-3 text-primary shrink-0" /> : <ImageIcon className="w-3 h-3 text-primary shrink-0" />}
                                  <span className="truncate text-[11px]">{el.type === 'text' ? el.content : 'Uploaded Artwork'}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTextureElements(prev => prev.filter(item => item.id !== el.id));
                                    if (selectedElementId === el.id) setSelectedElementId(null);
                                  }}
                                  className="p-0.5 hover:text-destructive text-muted-foreground rounded-full"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected Element Controls */}
                      {selectedElement && (
                        <div className="pt-2 border-t border-border/30 space-y-1.5">
                          <h3 className="font-bold text-[11px] text-foreground flex items-center gap-1">
                            <Move className="w-3 h-3 text-primary" /> Transform Layer
                          </h3>
                          
                          <div className="space-y-2 text-xs glass p-2.5 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-muted-foreground">Pos</label>
                                {['X', 'Y'].map((axis, i) => (
                                  <div key={axis} className="flex items-center gap-1">
                                    <span className="w-2.5 text-[9px] font-mono text-muted-foreground">{axis}</span>
                                    <input
                                      type="range"
                                      min="-1"
                                      max="1"
                                      step="0.01"
                                      value={selectedElement.position[i]}
                                      onChange={(e) => {
                                        const newPos = [...selectedElement.position] as [number, number, number];
                                        newPos[i] = parseFloat(e.target.value);
                                        handleUpdateElement(selectedElement.id, { position: newPos });
                                      }}
                                      className="flex-1 accent-primary h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-muted-foreground">Scale</label>
                                {['X', 'Y'].map((axis, i) => (
                                  <div key={axis} className="flex items-center gap-1">
                                    <span className="w-2.5 text-[9px] font-mono text-muted-foreground">{axis === 'X' ? 'W' : 'H'}</span>
                                    <input
                                      type="range"
                                      min="0.1"
                                      max="2"
                                      step="0.05"
                                      value={selectedElement.scale[i]}
                                      onChange={(e) => {
                                        const newScale = [...selectedElement.scale] as [number, number, number];
                                        newScale[i] = parseFloat(e.target.value);
                                        handleUpdateElement(selectedElement.id, { scale: newScale });
                                      }}
                                      className="flex-1 accent-primary h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center text-[9px]">
                                <label className="font-semibold text-muted-foreground">Rotate</label>
                                <span className="font-mono">{Math.round(((selectedElement.rotationAngle || 0) * 180) / Math.PI)}°</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={Math.PI * 2}
                                step="0.05"
                                value={selectedElement.rotationAngle || 0}
                                onChange={(e) => {
                                  handleUpdateElement(selectedElement.id, { rotationAngle: parseFloat(e.target.value) });
                                }}
                                className="w-full accent-primary h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            <button 
                              onClick={() => {
                                setTextureElements(prev => prev.filter(el => el.id !== selectedElement.id))
                                setSelectedElementId(null)
                              }}
                              className="w-full py-0.5 text-[10px] text-destructive glass hover:bg-destructive/10 rounded-full flex items-center justify-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Remove
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3D Canvas Component */}
          <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <Environment preset="city" />
            
            <Suspense fallback={null}>
              <ProductModel 
                type={selectedType}
                color={selectedColor}
                textureElements={textureElements}
                selectedElementId={selectedElementId}
                onElementSelect={setSelectedElementId}
                onElementUpdate={handlePositionUpdate}
                onLoad={(scene) => {
                  modelSceneRef.current = scene;
                }}
              />
            </Suspense>
            
            <OrbitControls 
              makeDefault 
              minDistance={1.8} 
              maxDistance={4.5} 
              enableZoom={true}
              zoomSpeed={0.5}
            />
          </Canvas>
          
          <div className="absolute bottom-4 left-4 right-4 text-center text-xs text-muted-foreground glass-pill py-2 px-4 pointer-events-none shadow-md z-10">
            Interactive 3D Preview • Drag or zoom model to inspect design from any angle
          </div>
        </div>

        {/* RIGHT 1/3 COLUMN: Floating Details & Publishing Controls */}
        <div className="lg:col-span-4 glass-card-rounded p-6 shadow-xl space-y-6 max-h-[calc(100vh-130px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h2 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span>Details & Publish</span>
            </h2>
          </div>

          <div className="space-y-4">
            {/* Design Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Design Title</label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="w-full px-3 py-2 rounded-full glass border border-white/20 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Galaxy Dreams Tee"
              />
            </div>

            {/* Price Input */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Retail Price ($USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={designPrice}
                  onChange={(e) => setDesignPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 rounded-full glass border border-white/20 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description</label>
              <textarea
                rows={3}
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                className="w-full p-3 rounded-2xl glass border border-white/20 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Describe your design artwork..."
              />
            </div>

            {/* Estimated Royalty Card */}
            <div className="glass p-4 rounded-2xl space-y-1.5 border border-white/20 text-center">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estimated Royalty</span>
              <div className="text-2xl font-black text-primary">
                ${(designPrice * 0.25).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ sale</span>
              </div>
              <p className="text-[10px] text-muted-foreground">25% artist revenue split calculated automatically.</p>
            </div>

            {/* Publish / Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="btn-highlight w-full py-3 text-xs gap-2"
              >
                {isPublishing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Publish Design to Store</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all decorations?')) {
                    setTextureElements([])
                    setSelectedElementId(null)
                  }
                }}
                className="btn-glass-pill w-full py-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Canvas
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}