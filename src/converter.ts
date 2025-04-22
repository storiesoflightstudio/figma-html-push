import { 
  JsonNode, 
  ConversionOptions, 
  ColorObject,
  NodeCreators,
  FigmaJsonNode
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
 * Check if the input is Figma-style JSON
 */
function isFigmaStyleJson(json: any): boolean {
  return (
    json && 
    (json.frames || // Top-level frames array
     json.type === 'FRAME' || // Single frame
     json.type === 'RECTANGLE' || // Rectangle element
     json.type === 'TEXT' || // Text element
     json.type === 'IMAGE') // Image element
  );
}

/**
 * Parse color string/object to Figma color object
 */
export function parseColor(color: string | ColorObject | undefined): ColorObject {
  if (!color) return { r: 0, g: 0, b: 0 };
  
  // If already a color object
  if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    return color;
  }
  
  // If string, parse it
  if (typeof color === 'string') {
    // Handle hex colors
    if (color.startsWith('#')) {
      return hexToRgb(color);
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      const values = color.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?/);
      
      if (values) {
        return {
          r: parseInt(values[1], 10) / 255,
          g: parseInt(values[2], 10) / 255,
          b: parseInt(values[3], 10) / 255
        };
      }
    }
  }
  
  return { r: 0, g: 0, b: 0 };
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): ColorObject {
  hex = hex.replace(/^#/, '');
  
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r, g, b };
}

/**
 * Convert Figma-style JSON to Figma nodes
 */
async function convertFigmaJsonToNodes(
  json: any, 
  options: ConversionOptions = {}
): Promise<SceneNode> {
  // If this is a top-level document with frames
  if (json.frames && Array.isArray(json.frames)) {
    const rootFrame = figma.createFrame();
    rootFrame.name = "Imported Design";
    rootFrame.resize(json.frames[0].width || 1200, json.frames[0].height || 800);
    rootFrame.fills = [];
    
    // Process each frame
    for (const frameData of json.frames) {
      const frame = await processFigmaNode(frameData);
      if (frame) {
        rootFrame.appendChild(frame);
      }
    }
    
    return rootFrame;
  }
  
  // If this is a single node
  return await processFigmaNode(json);
}

/**
 * Process a single Figma JSON node
 */
async function processFigmaNode(node: FigmaJsonNode): Promise<SceneNode> {
  let figmaNode: SceneNode;
  
  switch (node.type) {
    case 'FRAME':
      figmaNode = figma.createFrame();
      break;
    case 'RECTANGLE':
      figmaNode = figma.createRectangle();
      if (node.cornerRadius) {
        (figmaNode as RectangleNode).cornerRadius = node.cornerRadius;
      }
      break;
    case 'TEXT':
      figmaNode = figma.createText();
      if (node.text) {
        // Load fonts first
        await figma.loadFontAsync({ family: node.style?.fontFamily || "Inter", style: "Regular" });
        if (node.style?.fontWeight) {
          const weight = node.style.fontWeight >= 700 ? "Bold" : 
                        node.style.fontWeight >= 500 ? "Medium" : 
                        "Regular";
          await figma.loadFontAsync({ family: node.style?.fontFamily || "Inter", style: weight });
        }
        
        // Set text content
        (figmaNode as TextNode).characters = node.text;
        
        // Apply text styles
        if (node.style) {
          if (node.style.fontSize) {
            (figmaNode as TextNode).fontSize = node.style.fontSize;
          }
          if (node.style.fontWeight) {
            const weight = node.style.fontWeight >= 700 ? "Bold" : 
                          node.style.fontWeight >= 500 ? "Medium" : 
                          "Regular";
            (figmaNode as TextNode).fontName = { 
              family: node.style.fontFamily || "Inter", 
              style: weight 
            };
          }
          if (node.style.lineHeightPx) {
            (figmaNode as TextNode).lineHeight = { value: node.style.lineHeightPx, unit: "PIXELS" };
          }
          if (node.style.fills) {
            const fills: Paint[] = [];
            for (const fill of node.style.fills) {
              if (fill.type === 'SOLID' && fill.color) {
                fills.push({
                  type: 'SOLID',
                  color: parseColor(fill.color)
                });
              }
            }
            if (fills.length > 0) {
              (figmaNode as TextNode).fills = fills;
            }
          }
        }
        
        // Set text dimensions after content is set
        if (node.width) {
          (figmaNode as TextNode).textAutoResize = "WIDTH_AND_HEIGHT";
          // Resize after setting content to ensure proper text wrapping
          setTimeout(() => {
            (figmaNode as TextNode).resize(node.width, node.height || (figmaNode as TextNode).height);
          }, 10);
        }
      }
      break;
    default:
      figmaNode = figma.createFrame();
  }
  
  // Common properties
  if (node.name) figmaNode.name = node.name;
  
  // Position - relative to parent
  if (node.x !== undefined && node.y !== undefined) {
    figmaNode.x = node.x;
    figmaNode.y = node.y;
  }
  
  // Size
  if (node.width !== undefined && node.height !== undefined && figmaNode.type !== 'TEXT') {
    figmaNode.resize(node.width, node.height);
  }
  
  // Background color
  if (node.backgroundColor && figmaNode.type !== 'TEXT') {
    (figmaNode as FrameNode | RectangleNode).fills = [{ 
      type: 'SOLID', 
      color: parseColor(node.backgroundColor) 
    }];
  }
  
  // Fills
  if (node.fills && figmaNode.type !== 'TEXT') {
    const fills: Paint[] = [];
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.color) {
        fills.push({
          type: 'SOLID',
          color: parseColor(fill.color)
        });
      } else if (fill.type === 'IMAGE') {
        // For now, create a placeholder fill for images
        fills.push({
          type: 'SOLID',
          color: { r: 0.8, g: 0.8, b: 0.8 }
        });
      }
    }
    if (fills.length > 0) {
      (figmaNode as FrameNode | RectangleNode).fills = fills;
    }
  }
  
  // Process children
  if (node.children && node.children.length > 0 && isParentNode(figmaNode)) {
    for (const child of node.children) {
      const childNode = await processFigmaNode(child);
      if (childNode) {
        figmaNode.appendChild(childNode);
      }
    }
  }
  
  return figmaNode;
}

/**
 * Safely parse a dimension value to a number
 */
export function parseDimension(
  value: string | number | undefined, 
  defaultValue = 100
): number {
  if (typeof value === 'number') return value;
  if (value == null) return defaultValue;
  if (typeof value === 'string') {
    const cleanValue = value.replace(/px$/, '').trim();
    const parsedValue = parseFloat(cleanValue);
    return !isNaN(parsedValue) ? parsedValue : defaultValue;
  }
  return defaultValue;
}

/**
 * Main conversion function
 */
export async function convertJsonToFigma(
  json: any, 
  options: ConversionOptions = {}
): Promise<SceneNode> {
  // Check if this is Figma-style JSON
  if (isFigmaStyleJson(json)) {
    return await convertFigmaJsonToNodes(json, options);
  }
  
  // Otherwise, assume it's HTML-derived JSON
  return await convertHtmlJsonToFigma(json, options);
}

/**
 * Convert HTML-derived JSON to Figma nodes (legacy support)
 */
async function convertHtmlJsonToFigma(
  json: JsonNode, 
  options: ConversionOptions = {}
): Promise<FrameNode> {
  const mergedOptions: ConversionOptions = {
    preserveColors: true,
    preserveTextStyles: true,
    useAutoLayout: true,
    flattenDivs: false,
    extractComponents: false,
    ...options
  };

  const parentFrame = figma.createFrame();
  parentFrame.name = "HTML to Figma";
  
  const width = parseDimension(
    json?.position?.absolute?.width, 
    1440
  );
  const height = parseDimension(
    json?.position?.absolute?.height, 
    900
  );
  parentFrame.resize(width, height);
  
  parentFrame.fills = [{ 
    type: 'SOLID', 
    color: parseColor(json.styles?.backgroundColor || "#FFFFFF") 
  }];

  if (json.children && json.children.length > 0) {
    for (const child of json.children) {
      await processJsonNode(child, parentFrame, mergedOptions);
    }
  }

  return parentFrame;
}

/**
 * Process a single HTML-derived JSON node
 */
export async function processJsonNode(
  node: JsonNode, 
  parentNode: SceneNode, 
  options: ConversionOptions
): Promise<SceneNode | null> {
  if (!node) return null;

  let figmaNode: SceneNode;

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

  figmaNode = await (typeof createNode === 'function' 
    ? createNode(node, options) 
    : nodeCreators.createFrameNode(node, options));

  if (isParentNode(parentNode)) {
    parentNode.appendChild(figmaNode);
  }

  if (node.children && node.children.length > 0 && isParentNode(figmaNode)) {
    for (const child of node.children) {
      await processJsonNode(child, figmaNode, options);
    }
  }

  return figmaNode;
}

/**
 * Node creation functions for HTML-derived JSON
 */
export const nodeCreators: NodeCreators = {
  async createTextNode(node: JsonNode, options: ConversionOptions): Promise<TextNode> {
    const textNode = figma.createText();
    textNode.characters = node.text || "Placeholder Text";
    
    if (options.preserveTextStyles && node.styles) {
      if (node.styles.fontSize) {
        textNode.fontSize = parseFloat(node.styles.fontSize) || 16;
      }
      
      if (options.preserveColors && node.styles.color) {
        textNode.fills = [{ 
          type: 'SOLID', 
          color: parseColor(node.styles.color) 
        }];
      }
    }
    
    return textNode;
  },

  createImageNode(node: JsonNode, options: ConversionOptions): RectangleNode {
    const rect = figma.createRectangle();
    rect.name = `img${node.alt ? ` (${node.alt})` : ''}`;
    
    const width = parseDimension(
      node?.position?.absolute?.width
    );
    const height = parseDimension(
      node?.position?.absolute?.height
    );
    rect.resize(width, height);
    
    rect.fills = [{ 
      type: 'SOLID', 
      color: { r: 0.9, g: 0.9, b: 0.9 } 
    }];
    
    return rect;
  },

  async createInputNode(node: JsonNode, options: ConversionOptions): Promise<FrameNode> {
    const frame = figma.createFrame();
    frame.name = `input[type=${node.type || 'text'}]`;
    
    const width = parseDimension(
      node?.position?.absolute?.width
    );
    const height = parseDimension(
      node?.position?.absolute?.height
    );
    frame.resize(width, height);
    
    frame.fills = [{ 
      type: 'SOLID', 
      color: { r: 1, g: 1, b: 1 } 
    }];
    
    return frame;
  },

  createFrameNode(node: JsonNode, options: ConversionOptions): FrameNode {
    const frame = figma.createFrame();
    
    const idPart = node.id ? `#${node.id}` : '';
    const classPart = (node.classes && node.classes.length > 0) 
      ? `.${node.classes.join('.')}` 
      : '';
    frame.name = `${node.type || 'div'}${idPart}${classPart}`;
    
    const width = parseDimension(
      node?.position?.absolute?.width
    );
    const height = parseDimension(
      node?.position?.absolute?.height
    );
    frame.resize(width, height);
    
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
