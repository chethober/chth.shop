# UI Component TypeScript Contracts

**Feature**: Rewrite UI Components with shadcn/ui
**Directory**: `frontend/components/ui/`

---

## 1. Form & Interactive Controls

### 1.1 Button (`button.tsx`)
```typescript
import * as React from "react"
import { type VariantProps } from "class-variance-authority"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export declare const buttonVariants: (props?: {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}) => string

export declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>
```

### 1.2 Input (`input.tsx`)
```typescript
import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export declare const Input: React.ForwardRefExoticComponent<
  InputProps & React.RefAttributes<HTMLInputElement>
>
```

### 1.3 Textarea (`textarea.tsx`)
```typescript
import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export declare const Textarea: React.ForwardRefExoticComponent<
  TextareaProps & React.RefAttributes<HTMLTextAreaElement>
>
```

### 1.4 Label (`label.tsx`)
```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { type VariantProps } from "class-variance-authority"

export declare const Label: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> &
    React.RefAttributes<React.ElementRef<typeof LabelPrimitive.Root>>
>
```

### 1.5 Switch (`switch.tsx`)
```typescript
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

export declare const Switch: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
    React.RefAttributes<React.ElementRef<typeof SwitchPrimitives.Root>>
>
```

### 1.6 Slider (`slider.tsx`)
```typescript
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

export declare const Slider: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> &
    React.RefAttributes<React.ElementRef<typeof SliderPrimitive.Root>>
>
```

### 1.7 Badge (`badge.tsx`)
```typescript
import * as React from "react"
import { type VariantProps } from "class-variance-authority"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export declare const badgeVariants: (props?: {
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}) => string

export declare function Badge(props: BadgeProps): React.JSX.Element
```

---

## 2. Layout & Presentation

### 2.1 Card (`card.tsx`)
```typescript
import * as React from "react"

export declare const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
export declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
export declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>
export declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>
export declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
export declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
```

### 2.2 Separator (`separator.tsx`)
```typescript
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

export declare const Separator: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> &
    React.RefAttributes<React.ElementRef<typeof SeparatorPrimitive.Root>>
>
```

### 2.3 Avatar (`avatar.tsx`)
```typescript
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

export declare const Avatar: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & React.RefAttributes<React.ElementRef<typeof AvatarPrimitive.Root>>>
export declare const AvatarImage: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & React.RefAttributes<React.ElementRef<typeof AvatarPrimitive.Image>>>
export declare const AvatarFallback: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & React.RefAttributes<React.ElementRef<typeof AvatarPrimitive.Fallback>>>
```

---

## 3. Overlays, Navigation, & Disclosures

### 3.1 Dialog (`dialog.tsx`)
```typescript
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

export declare const Dialog: typeof DialogPrimitive.Root
export declare const DialogTrigger: typeof DialogPrimitive.Trigger
export declare const DialogPortal: typeof DialogPrimitive.Portal
export declare const DialogClose: typeof DialogPrimitive.Close
export declare const DialogOverlay: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & React.RefAttributes<React.ElementRef<typeof DialogPrimitive.Overlay>>>
export declare const DialogContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof DialogPrimitive.Content>>>
export declare const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
export declare const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
export declare const DialogTitle: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & React.RefAttributes<React.ElementRef<typeof DialogPrimitive.Title>>>
export declare const DialogDescription: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & React.RefAttributes<React.ElementRef<typeof DialogPrimitive.Description>>>
```

### 3.2 Sheet (`sheet.tsx`)
```typescript
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: "top" | "bottom" | "left" | "right"
}

export declare const Sheet: typeof SheetPrimitive.Root
export declare const SheetTrigger: typeof SheetPrimitive.Trigger
export declare const SheetClose: typeof SheetPrimitive.Close
export declare const SheetContent: React.ForwardRefExoticComponent<SheetContentProps & React.RefAttributes<React.ElementRef<typeof SheetPrimitive.Content>>>
export declare const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
export declare const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
export declare const SheetTitle: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> & React.RefAttributes<React.ElementRef<typeof SheetPrimitive.Title>>>
export declare const SheetDescription: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> & React.RefAttributes<React.ElementRef<typeof SheetPrimitive.Description>>>
```

### 3.3 Dropdown Menu (`dropdown-menu.tsx`)
```typescript
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"

export declare const DropdownMenu: typeof DropdownMenuPrimitive.Root
export declare const DropdownMenuTrigger: typeof DropdownMenuPrimitive.Trigger
export declare const DropdownMenuContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof DropdownMenuPrimitive.Content>>>
export declare const DropdownMenuItem: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean } & React.RefAttributes<React.ElementRef<typeof DropdownMenuPrimitive.Item>>>
export declare const DropdownMenuLabel: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean } & React.RefAttributes<React.ElementRef<typeof DropdownMenuPrimitive.Label>>>
export declare const DropdownMenuSeparator: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & React.RefAttributes<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>>
```

### 3.4 Tabs (`tabs.tsx`)
```typescript
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

export declare const Tabs: typeof TabsPrimitive.Root
export declare const TabsList: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.List>>>
export declare const TabsTrigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Trigger>>>
export declare const TabsContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof TabsPrimitive.Content>>>
```

### 3.5 Tooltip (`tooltip.tsx`)
```typescript
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

export declare const TooltipProvider: typeof TooltipPrimitive.Provider
export declare const Tooltip: typeof TooltipPrimitive.Root
export declare const TooltipTrigger: typeof TooltipPrimitive.Trigger
export declare const TooltipContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & React.RefAttributes<React.ElementRef<typeof TooltipPrimitive.Content>>>
```
