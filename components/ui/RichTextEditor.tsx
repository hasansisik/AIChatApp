import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Text, TextInput, Keyboard, Platform } from 'react-native';
import { Foundation,MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';

interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  onHtmlChange?: (html: string) => void;
}

export interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  heading: boolean;
  bullet: boolean;
  quote: boolean;
  code: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
}

// Available text colors
const TEXT_COLORS = [
  { name: 'black', value: Colors.black },
  { name: 'primary', value: Colors.primary },
  { name: 'red', value: '#e74c3c' },
  { name: 'green', value: '#2ecc71' },
  { name: 'blue', value: '#3498db' },
  { name: 'purple', value: '#9b59b6' },
];

// Text Node interface
interface TextNode {
  id: string;
  text: string;
  format: TextFormat;
  html: string; // HTML representation of the node
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChangeText,
  placeholder = 'İçerik giriniz...',
  minHeight = 150,
  onHtmlChange
}) => {
  // Default format
  const defaultFormat: TextFormat = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    heading: false,
    bullet: false,
    quote: false,
    code: false,
    color: Colors.black,
    align: 'left'
  };
  
  // Active format for the current cursor position
  const [activeFormat, setActiveFormat] = useState<TextFormat>({...defaultFormat});
  
  // Current text nodes with their own formats
  const [textNodes, setTextNodes] = useState<TextNode[]>([
    {
      id: '1',
      text: value || '',
      format: {...defaultFormat},
      html: value || ''
    }
  ]);
  
  // Active text node ID (where cursor is)
  const [activeNodeId, setActiveNodeId] = useState<string>('1');
  
  // Current input text (temporary buffer for editing)
  const [currentInput, setCurrentInput] = useState('');
  
  // Show color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Text input reference
  const inputRef = useRef<TextInput>(null);
  
  // Update HTML output whenever nodes change
  useEffect(() => {
    if (onHtmlChange) {
      onHtmlChange(generateHtml());
    }
  }, [textNodes]);
  
  // Generate a unique ID for new nodes
  const generateId = () => {
    return Date.now().toString();
  };
  
  // Generate HTML for a single node
  const generateNodeHtml = (node: TextNode): string => {
    let html = node.text;
    const format = node.format;
    
    if (!html) return '';
    
    // Replace new lines with <br> for proper HTML rendering
    html = html.replace(/\n/g, '<br>');
    
    // Process line breaks to create new list items for bullet points
    if (format.bullet && html.includes('<br>')) {
      const lines = html.split('<br>');
      return lines.map(line => line.trim() ? `<li>${line}</li>` : '').join('');
    }
    
    // Apply formatting based on active formats
    if (format.heading) {
      html = `<h2>${html}</h2>`;
    } else if (format.bullet) {
      html = `<li>${html}</li>`;
    } else if (format.quote) {
      html = `<blockquote>${html}</blockquote>`;
    } else if (format.code) {
      html = `<code>${html}</code>`;
    } else {
      // Standard text formatting
      let formattedHtml = html;
      
      if (format.bold) {
        formattedHtml = `<strong>${formattedHtml}</strong>`;
      }
      
      if (format.italic) {
        formattedHtml = `<em>${formattedHtml}</em>`;
      }
      
      if (format.underline) {
        formattedHtml = `<u>${formattedHtml}</u>`;
      }
      
      if (format.strikethrough) {
        formattedHtml = `<del>${formattedHtml}</del>`;
      }
      
      if (format.color !== Colors.black) {
        formattedHtml = `<span style="color:${format.color}">${formattedHtml}</span>`;
      }
      
      if (format.align !== 'left') {
        formattedHtml = `<div style="text-align:${format.align}">${formattedHtml}</div>`;
      }
      
      html = formattedHtml;
    }
    
    return html;
  };
  
  // Generate complete HTML from all nodes
  const generateHtml = (): string => {
    // Group nodes by type to handle special cases like bullet lists
    const bulletNodes: TextNode[] = [];
    const otherNodes: TextNode[] = [];
    
    textNodes.forEach(node => {
      if (node.format.bullet) {
        bulletNodes.push(node);
      } else {
        otherNodes.push(node);
      }
    });
    
    // Process bullet nodes (wrap in <ul>)
    let bulletHtml = '';
    if (bulletNodes.length > 0) {
      const bulletItems = bulletNodes.map(node => generateNodeHtml(node)).join('');
      bulletHtml = `<ul>${bulletItems}</ul>`;
    }
    
    // Process other nodes
    const otherHtml = otherNodes.map(node => {
      // Calculate HTML for this node
      const nodeHtml = generateNodeHtml(node);
      
      // Update node's HTML
      node.html = nodeHtml;
      
      return nodeHtml;
    }).join('');
    
    return bulletHtml + otherHtml;
  };

  // Toggle a format and create a new node if needed
  const toggleFormat = (formatType: keyof TextFormat) => {
    // Update the active format
    const newFormat = {
      ...activeFormat,
      [formatType]: !activeFormat[formatType]
    };
    
    setActiveFormat(newFormat);
    
    // Create a new node with the updated format
    const newId = generateId();
    
    setTextNodes(prevNodes => {
      // Find the active node
      const activeNode = prevNodes.find(node => node.id === activeNodeId);
      if (!activeNode) return prevNodes;
      
      // Keep track of where this node is
      const activeIndex = prevNodes.findIndex(node => node.id === activeNodeId);
      
      // Create a new node with the new format
      const newNode: TextNode = {
        id: newId,
        text: '',
        format: newFormat,
        html: ''
      };
      
      // Insert the new node after the active one
      const updatedNodes = [...prevNodes];
      updatedNodes.splice(activeIndex + 1, 0, newNode);
      
      return updatedNodes;
    });
    
    // Set the new node as active
    setActiveNodeId(newId);
    setCurrentInput('');
    
    // Focus the input after toggling format
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };
  
  // Set text alignment
  const setAlignment = (align: 'left' | 'center' | 'right') => {
    // Update the active format
    const newFormat = {
      ...activeFormat,
      align
    };
    
    setActiveFormat(newFormat);
    
    // Create a new node with the updated format
    const newId = generateId();
    
    setTextNodes(prevNodes => {
      // Find the active node
      const activeNode = prevNodes.find(node => node.id === activeNodeId);
      if (!activeNode) return prevNodes;
      
      // Keep track of where this node is
      const activeIndex = prevNodes.findIndex(node => node.id === activeNodeId);
      
      // Create a new node with the new format
      const newNode: TextNode = {
        id: newId,
        text: '',
        format: newFormat,
        html: ''
      };
      
      // Insert the new node after the active one
      const updatedNodes = [...prevNodes];
      updatedNodes.splice(activeIndex + 1, 0, newNode);
      
      return updatedNodes;
    });
    
    // Set the new node as active
    setActiveNodeId(newId);
    setCurrentInput('');
    
    // Focus the input after changing alignment
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };
  
  // Set text color and create a new node
  const setTextColor = (color: string) => {
    const newFormat = {
      ...activeFormat,
      color
    };
    
    setActiveFormat(newFormat);
    setShowColorPicker(false);
    
    // Create a new node with the updated format
    const newId = generateId();
    
    setTextNodes(prevNodes => {
      // Find the active node
      const activeNode = prevNodes.find(node => node.id === activeNodeId);
      if (!activeNode) return prevNodes;
      
      // Keep track of where this node is
      const activeIndex = prevNodes.findIndex(node => node.id === activeNodeId);
      
      // Create a new node with the new format
      const newNode: TextNode = {
        id: newId,
        text: '',
        format: newFormat,
        html: ''
      };
      
      // Insert the new node after the active one
      const updatedNodes = [...prevNodes];
      updatedNodes.splice(activeIndex + 1, 0, newNode);
      
      return updatedNodes;
    });
    
    // Set the new node as active
    setActiveNodeId(newId);
    setCurrentInput('');
    
    // Focus the input after changing color
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };
  
  // Handle text input in the active node
  const handleTextChange = (text: string) => {
    setCurrentInput(text);
    
    setTextNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node => {
        if (node.id === activeNodeId) {
          return {
            ...node,
            text
          };
        }
        return node;
      });
      
      // Filter out empty nodes except the active one
      const filteredNodes = updatedNodes.filter(node => 
        node.text !== '' || node.id === activeNodeId
      );
      
      // Update the combined text for parent component
      const combinedText = filteredNodes.map(node => node.text).join('');
      onChangeText(combinedText);
      
      return filteredNodes;
    });
  };
  
  // Create a new paragraph node
  const createNewParagraph = () => {
    const newId = generateId();
    
    setTextNodes(prevNodes => {
      // Keep current formatting when creating a new paragraph
      const newNode: TextNode = {
        id: newId,
        text: '',
        format: {...activeFormat},
        html: ''
      };
      
      return [...prevNodes, newNode];
    });
    
    // Set the new node as active
    setActiveNodeId(newId);
    setCurrentInput('');
    
    // Focus the input after creating a new paragraph
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };
  
  // Create a bullet list item
  const createBulletItem = () => {
    // Toggle bullet in active format
    const newFormat = {
      ...activeFormat,
      bullet: !activeFormat.bullet
    };
    
    setActiveFormat(newFormat);
    
    // Create a new node with bullet format
    const newId = generateId();
    
    setTextNodes(prevNodes => {
      // Keep track of where this node is
      const activeIndex = prevNodes.findIndex(node => node.id === activeNodeId);
      
      // Create a new node with the new format
      const newNode: TextNode = {
        id: newId,
        text: '',
        format: newFormat,
        html: ''
      };
      
      // Insert the new node after the active one
      const updatedNodes = [...prevNodes];
      updatedNodes.splice(activeIndex + 1, 0, newNode);
      
      return updatedNodes;
    });
    
    // Set the new node as active
    setActiveNodeId(newId);
    setCurrentInput('');
    
    // Focus the input after creating a bullet item
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };
  
  // Set a specific node as active
  const setNodeActive = (nodeId: string) => {
    setActiveNodeId(nodeId);
    
    // Get the format and text of the selected node
    const node = textNodes.find(n => n.id === nodeId);
    if (node) {
      setActiveFormat(node.format);
      setCurrentInput(node.text);
    }
    
    // Focus the input after setting a node active
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.bold && styles.activeToolbarButton]} 
          onPress={() => toggleFormat('bold')}
        >
          <Foundation name="bold" size={20} color={activeFormat.bold ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.italic && styles.activeToolbarButton]}
          onPress={() => toggleFormat('italic')}
        >
          <Foundation name="italic" size={20} color={activeFormat.italic ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.underline && styles.activeToolbarButton]}
          onPress={() => toggleFormat('underline')}
        >
          <MaterialIcons name="format-underlined" size={20} color={activeFormat.underline ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.strikethrough && styles.activeToolbarButton]}
          onPress={() => toggleFormat('strikethrough')}
        >
          <MaterialIcons name="format-strikethrough" size={20} color={activeFormat.strikethrough ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.heading && styles.activeToolbarButton]}
          onPress={() => toggleFormat('heading')}
        >
          <MaterialIcons name="title" size={20} color={activeFormat.heading ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.bullet && styles.activeToolbarButton]}
          onPress={createBulletItem}
        >
          <MaterialIcons name="format-list-bulleted" size={20} color={activeFormat.bullet ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.quote && styles.activeToolbarButton]}
          onPress={() => toggleFormat('quote')}
        >
          <MaterialIcons name="format-quote" size={20} color={activeFormat.quote ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.code && styles.activeToolbarButton]}
          onPress={() => toggleFormat('code')}
        >
          <MaterialIcons name="code" size={20} color={activeFormat.code ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.align === 'left' && styles.activeToolbarButton]}
          onPress={() => setAlignment('left')}
        >
          <MaterialIcons name="format-align-left" size={20} color={activeFormat.align === 'left' ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.align === 'center' && styles.activeToolbarButton]}
          onPress={() => setAlignment('center')}
        >
          <MaterialIcons name="format-align-center" size={20} color={activeFormat.align === 'center' ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, activeFormat.align === 'right' && styles.activeToolbarButton]}
          onPress={() => setAlignment('right')}
        >
          <MaterialIcons name="format-align-right" size={20} color={activeFormat.align === 'right' ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, showColorPicker && styles.activeToolbarButton]}
          onPress={() => setShowColorPicker(!showColorPicker)}
        >
          <View style={[styles.colorIndicator, { backgroundColor: activeFormat.color }]} />
          <MaterialIcons name="color-lens" size={20} color={showColorPicker ? Colors.lightWhite : Colors.black} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolbarButton}
          onPress={createNewParagraph}
        >
          <MaterialIcons name="keyboard-return" size={20} color={Colors.black} />
        </TouchableOpacity>
      </View>
      
      {showColorPicker && (
        <View style={styles.colorPickerContainer}>
          {TEXT_COLORS.map((color) => (
            <TouchableOpacity
              key={color.name}
              style={[
                styles.colorOption,
                { backgroundColor: color.value },
                activeFormat.color === color.value && styles.selectedColorOption
              ]}
              onPress={() => setTextColor(color.value)}
            />
          ))}
        </View>
      )}
      
      <ScrollView 
        style={[styles.editorScrollView, { minHeight }]} 
        contentContainerStyle={styles.editorContent}
      >
        <View style={styles.textContainer}>
          {textNodes.map(node => {
            const { format, text, id } = node;
            
            const textStyle = [
              styles.nodeText,
              format.bold && styles.boldText,
              format.italic && styles.italicText,
              format.underline && styles.underlineText,
              format.strikethrough && styles.strikethroughText,
              format.heading && styles.headingText,
              format.bullet && styles.bulletText,
              format.quote && styles.quoteText,
              format.code && styles.codeText,
              { color: format.color }
            ];
            
            const isActive = id === activeNodeId;
            
            return (
              <View 
                key={id} 
                style={[
                  styles.textNode, 
                  isActive && styles.activeNode,
                  format.align === 'center' && styles.centerContainer,
                  format.align === 'right' && styles.rightContainer,
                ]}
              >
                {format.bullet && <Text style={styles.bulletPoint}>• </Text>}
                <Text style={textStyle}>
                  {text || (isActive ? '' : ' ')}
                </Text>
                {isActive && (
                  <View style={styles.cursorIndicator} />
                )}
              </View>
            );
          })}
          {textNodes.length === 0 && (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        
        {/* Hidden input for keyboard interaction */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          multiline
          value={currentInput}
          onChangeText={handleTextChange}
          autoFocus
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.lightWhite,
    marginTop: 8,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.lightWhite,
  },
  toolbarButton: {
    padding: 8,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToolbarButton: {
    backgroundColor: Colors.primary,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: Colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    justifyContent: 'space-around',
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: Colors.lightWhite,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  editorScrollView: {
    maxHeight: 200,
  },
  editorContent: {
    flexGrow: 1,
    padding: 12,
    position: 'relative',
  },
  textContainer: {
    flexDirection: 'column', // Changed to column for better layout
    width: '100%',
  },
  textNode: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    marginBottom: 2, // Small gap between nodes
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  rightContainer: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  activeNode: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  nodeText: {
    fontSize: 16,
    color: Colors.black,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 4,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    height: '100%',
    width: '100%',
  },
  placeholder: {
    fontSize: 16,
    color: Colors.description,
  },
  cursorIndicator: {
    width: 2,
    height: 18,
    backgroundColor: Colors.primary,
    marginLeft: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
  },
  headingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bulletText: {
    marginLeft: 8,
  },
  quoteText: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: 8,
    fontStyle: 'italic',
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
});

export default RichTextEditor; 