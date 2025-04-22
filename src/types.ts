// Types for JSON conversion
export interface Position {
  absolute: {
    width: string | number;
    height: string | number;
  };
}

export interface Styles {
  [key: string]: string;
}

export interface JsonNode {
  type: string;
  id?: string;
  classes?: string[];
  styles: Styles;
  position: Position;
  children?: JsonNode[];
  text?: string;
  placeholder?: string;
  alt?: string;
}

// Figma-style JSON types
export interface FigmaJsonNode {
  id: string;
  name: string;
  type: 'FRAME' | 'RECTANGLE' | 'TEXT' | 'IMAGE' | 'GROUP' | 'COMPONENT';
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: ColorObject | string;
  cornerRadius?: number;
  fills?: Paint[];
  children?: FigmaJsonNode[];
  text?: string;
  style?: TextStyle;
}

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeightPx?: number;
  fills?: Paint[];
}

export interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';
  color?: ColorObject | string;
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
  imageHash?: string;
}

export interface ColorObject {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface ConversionOptions {
  preserveColors?: boolean;
  preserveTextStyles?: boolean;
  useAutoLayout?: boolean;
  flattenDivs?: boolean;
  extractComponents?: boolean;
  defaultFontFamily?: string;
}

// Node creation function types
export interface NodeCreationOptions extends ConversionOptions {
  // Additional options specific to node creation if needed
}

export type NodeCreationFunction = (
  node: JsonNode, 
  options: NodeCreationOptions
) => Promise<SceneNode> | SceneNode;

export interface NodeCreators {
  createTextNode: NodeCreationFunction;
  createImageNode: NodeCreationFunction;
  createInputNode: NodeCreationFunction;
  createFrameNode: NodeCreationFunction;
}
