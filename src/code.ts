import { convertJsonToFigma } from './converter';
import { JsonNode, ConversionOptions } from './types';

// Show the UI
figma.showUI(__html__, { width: 450, height: 650 });

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'convert-json') {
    try {
      // Default options
      const options: ConversionOptions = {
        preserveColors: true,
        preserveTextStyles: true,
        useAutoLayout: true,
        flattenDivs: false,
        extractComponents: false
      };

      // Ensure JSON data is valid
      if (!msg.jsonData) {
        throw new Error('No JSON data provided');
      }

      // Convert JSON to Figma layout
      const rootNode = await convertJsonToFigma(
        msg.jsonData as JsonNode, 
        options
      );
      
      // Focus on the created layout
      figma.currentPage.selection = [rootNode];
      figma.viewport.scrollAndZoomIntoView([rootNode]);
      
      // Notify successful conversion
      figma.ui.postMessage({ type: 'conversion-complete' });
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Send error back to UI
      figma.ui.postMessage({ 
        type: 'conversion-error', 
        error: (error as Error).message || 'Unknown error occurred'
      });
    }
  } else if (msg.type === 'cancel') {
    // User canceled, close the plugin
    figma.closePlugin();
  }
};
