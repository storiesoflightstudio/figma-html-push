# HTML Whisperer: HTML to Figma Converter

A Figma plugin that converts HTML/CSS structures (in JSON format) to editable Figma designs, preserving styles, layout, and component hierarchy.

## 🚀 Features

- Convert HTML/CSS structures to Figma frames, text, and shapes
- Preserve styling including colors, text styles, borders, and more
- Automatically convert flexbox layouts to Figma Auto Layout
- Support for common HTML elements (text, images, inputs, etc.)
- Configurable conversion options

## 🔧 How It Works

1. **Input JSON**: Paste JSON data representing HTML/CSS structure
2. **Configure Options**: Customize the conversion settings:
   - Preserve colors and text styles
   - Use Auto Layout
   - Flatten empty divs
   - Extract repeated elements as components
   - Set default font family and viewport dimensions
3. **Convert**: One-click conversion to Figma elements
4. **Edit**: Work with the generated Figma elements just like native ones

## 🔍 Usage Guide

1. Run the plugin in Figma
2. Paste JSON data (from your HTML parser) into the JSON tab
3. Adjust conversion options as needed
4. Click "Convert to Figma"
5. Edit and refine the generated design

## 🛠️ Development Setup

To work on this plugin, you'll need:

1. **Node.js and npm**: For dependency management
2. **Figma Desktop App**: For testing the plugin

### Getting Started

1. Clone this repository
2. Run `npm install` to install dependencies
3. Make your changes to the code
4. Load the plugin in Figma: Plugins > Development > Import plugin from manifest...

## 📝 Notes

- This plugin requires properly formatted JSON input describing HTML/CSS structure
- For best results, ensure your HTML structure is well-formatted and uses standard CSS properties
- The plugin works best with modern HTML that uses flexbox for layout

## 🔮 Future Plans

- Add AI integration for generating layouts from text prompts
- Support for more complex CSS properties
- Improved component extraction
