import { 
  JsonNode, 
  ConversionOptions, 
  ColorObject,
  NodeCreators
} from './types';

// Utility type guard to check if a node can have children
function isParentNode(node: SceneNode): node is FrameNode | GroupNode | ComponentNode {
  return (
    node.type === 'FRAME' || 
    node.type === 'GROUP' || 
    node.type === 'COMPONENT'
  );
}

/**
 * Safely parse a dimension value to a number
 */
export function parseDimension(
  value: string | number | undefined, 
  defaultValue = 100
): number {
  // If already a number, return it
  if (typeof value === 'number') return value;
  
  // If undefined or null, return default
  if (value == null) return defaultValue;
  
  // If string, try to parse
  if (typeof value === 'string') {
    // Remove 'px' and trim
    const cleanValue = value.replace(/px$/, '').trim();
    
    // Parse as float
    const parsedValue = parseFloat(cleanValue);
    
    // Return parsed value if valid, otherwise default
    return !isNaN(parsedValue) ? parsedValue : defaultValue;
  }
  
  // Fallback to default for any other type
  return defaultValue;
}

/**
 * Parse color string to Figma color object
 */
export function parseColor(colorStr?: string): ColorObject {
  if (!colorStr) return { r: 0, g: 0, b: 0 };
  
  // Handle hex colors
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr);
  }
  
  // Handle rgb/rgba colors
  if (colorStr.startsWith('rgb')) {
    const values = colorStr.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?/);
    
    if (values) {
      return {
        r: parseInt(values[1], 10) / 255,
        g: parseInt(values[2], 10) / 255,
        b: parseInt(values[3], 10) / 255
      };
    }
  }
  
  // Handle named colors (simplified)
  const namedColors: { [key: string]: ColorObject } = {
    'transparent': { r: 0, g: 0, b: 0, a: 0 },
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 1, g: 1, b: 1 },
    'red': { r: 1, g: 0, b: 0 },
    'green': { r: 0, g: 1, b: 0 },
    'blue': { r: 0, g: 0, b: 1 },
    'yellow': { r: 1, g: 1, b: 0 },
    'gray': { r: 0.5, g: 0.5, b: 0.5 }
  };
  
  return namedColors[colorStr.toLowerCase()] || { r: 0, g: 0, b: 0 };
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): ColorObject {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle shortened hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r, g, b };
}

/**
 * Node creation functions
 */
export const nodeCreators: NodeCreators = {
  /**
   * Create a text node
   */
  async createTextNode(node: JsonNode, options: ConversionOptions): Promise<TextNode> {
    const textNode = figma.createText();
    
    // Text content
    textNode.characters = node.text || "Placeholder Text";
    
    // Font and styling
    if (options.preserveTextStyles && node.styles) {
      // Font size
      if (node.styles.fontSize) {
        textNode.fontSize = parseFloat(node.styles.fontSize) || 16;
      }
      
      // Text color
      if (options.preserveColors && node.styles.color) {
        textNode.fills = [{ 
          type: 'SOLID', 
          color: parseColor(node.styles.color) 
        }];
      }
    }
    
    return textNode;
  },

  /**
   * Create an image node (placeholder)
   */
  createImageNode(node: JsonNode, options: ConversionOptions): RectangleNode {
    const rect = figma.createRectangle();
    
    // Set name
    rect.name = `img${node.alt ? ` (${node.alt})` : ''}`;
    
    // Size
    const width = parseDimension(
      node?.position?.absolute?.width
    );
    const height = parseDimension(
      node?.position?.absolute?.height
    );
    rect.resize(width, height);
    
    // Placeholder fill
    rect.fills = [{ 
      type: 'SOLID', 
      color: { r: 0.9, g: 0.9, b: 0.9 } 
    }];
    
    return rect;
  },

  /**
   * Create an input node (placeholder)
   */
  async createInputNode(node: JsonNode, options: ConversionOptions): Promise<FrameNode> {
    const frame = figma.createFrame();
    frame.name = `input[type=${node.type || 'text'}]`;
    
    // Size
    const width = parseDimension(
      node?.position?.absolute?.width
    );
    const height = parseDimension(
      node?.position?.absolute?.height
    );
    frame.resize(width, height);
    
    // Background
    frame.fills = [{ 
      type: 'SOLID', 
      color: { r: 1, g: 1, b: 1 } 
    }];
    
    return frame;
  },

  /**
   * Create a frame node
   */
  createFrameNode(node: JsonNode, options: ConversionOptions): FrameNode {
    const frame = figma.createFrame();
    
    // Name
    const idPart = node.id ? `#${node.id}` : '';
    const classPart = (node.classes && node.classes.length > 0) 
      ? `.${node.classes.join('.')}` 
      : '';
    frame.name = `${node.type || 'div'}${idPart}${classPart}`;
    
    // Size
    const width = parseDimension(
      node?.position?.absolute?.width
    );
    const height = parseDimension(
      node?.position?.absolute?.height
    );
    frame.resize(width, height);
    
    // Background
    if (options.preserveColors && 
      node.styles?.backgroundColor && 
      node.styles.backgroundColor !== 'transparent') {
      frame.fills = [{ 
        type: 'SOLID', 
        color: parseColor(node.styles.backgroundColor) 
      }];
    }
    
    return frame;
  }
};

/**
 * Main conversion function
 */
export async function convertJsonToFigma(
  json: JsonNode, 
  options: ConversionOptions = {}
): Promise<FrameNode> {
  // Default options
  const mergedOptions: ConversionOptions = {
    preserveColors: true,
    preserveTextStyles: true,
    useAutoLayout: true,
    flattenDivs: false,
    extractComponents: false,
    ...options
  };

  // Create parent frame
  const parentFrame = figma.createFrame();
  parentFrame.name = "HTML to Figma";
  
  // Dimensions
  const width = parseDimension(
    json?.position?.absolute?.width, 
    1440
  );
  const height = parseDimension(
    json?.position?.absolute?.height, 
    900
  );
  parentFrame.resize(width, height);
  
  // Background
  parentFrame.fills = [{ 
    type: 'SOLID', 
    color: parseColor(json.styles?.backgroundColor || "#FFFFFF") 
  }];

  // Process children
  if (json.children && json.children.length > 0) {
    for (const child of json.children) {
      await processJsonNode(child, parentFrame, mergedOptions);
    }
  }

  return parentFrame;
}

/**
 * Process a single JSON node
 */
export async function processJsonNode(
  node: JsonNode, 
  parentNode: SceneNode, 
  options: ConversionOptions
): Promise<SceneNode | null> {
  if (!node) return null;

  let figmaNode: SceneNode;

  // Determine node creation function
  const createNode = (() => {
    switch (node.type) {
      case 'text': return nodeCreators.createTextNode;
      case 'img': return nodeCreators.createImageNode;
      case 'input':
      case 'textarea':
      case 'select': return nodeCreators.createInputNode;
      default: return nodeCreators.createFrameNode;
    }
  })();

  // Create node
  figmaNode = await (typeof createNode === 'function' 
    ? createNode(node, options) 
    : nodeCreators.createFrameNode(node, options));

  // Safely append child to parent if possible
  if (isParentNode(parentNode)) {
    parentNode.appendChild(figmaNode);
  }

  // Process children if any
  if (node.children && node.children.length > 0 && isParentNode(figmaNode)) {
    for (const child of node.children) {
      await processJsonNode(child, figmaNode, options);
    }
  }

  return figmaNode;
}
