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

export interface ConversionOptions {
  preserveColors?: boolean;
  preserveTextStyles?: boolean;
  useAutoLayout?: boolean;
  flattenDivs?: boolean;
  extractComponents?: boolean;
  defaultFontFamily?: string;
}

export interface ColorObject {
  r: number;
  g: number;
  b: number;
  a?: number;
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
