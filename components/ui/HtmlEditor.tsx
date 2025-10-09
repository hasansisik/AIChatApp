import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,

} from 'react-native';
import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';

interface HtmlEditorProps {
  value: string;
  onChangeText: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  style?: any;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({
  value,
  onChangeText,
  placeholder = 'İlanınızı detaylı şekilde açıklayınız...',
  minHeight = 150,
  style,
}) => {
  const richText = useRef<RichEditor>(null);
  const [editorHeight, setEditorHeight] = useState(minHeight);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Güvenli string değeri
  const safeValue = value || '';

  // Editor hazır olduğunda içeriği ayarla
  useEffect(() => {
    
    if (richText.current && isEditorReady && safeValue && safeValue.trim() !== '') {
      // Kısa gecikme ile içeriği ayarla
      setTimeout(() => {
        try {
          richText.current?.setContentHTML(safeValue);
        } catch (error) {
          console.error('HtmlEditor: Error setting content HTML:', error);
        }
      }, 100);
    }
  }, [safeValue, isEditorReady]);

  const handleContentChange = (html: string) => {
    // HTML içeriğini temizle ve doğrula
    const cleanHtml = html || '';
    onChangeText(cleanHtml);
  };

  const handleHeightChange = (height: number) => {
    setEditorHeight(Math.max(height, minHeight));
  };

  const handleEditorInitialized = () => {
    setIsEditorReady(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Rich Text Editor */}
      <RichEditor
        ref={richText}
        style={[styles.editor, { minHeight: editorHeight }]}
        containerStyle={styles.editorContainer}
        editorStyle={{
          backgroundColor: Colors.lightWhite,
          color: Colors.black,
          contentCSSText: `font-size: 16px; font-family: System; line-height: 24px; padding: 12px; min-height: ${minHeight}px;`,
        }}
        placeholder={placeholder}
        initialContentHTML={safeValue || ''} // HTML içeriğini doğrudan yükle
        onChange={handleContentChange}
        onHeightChange={handleHeightChange}
        onLoad={handleEditorInitialized} // Editor yüklendiğinde tetikle
        useContainer={true}
        initialHeight={minHeight}
        pasteAsPlainText={true} // Düz metin olarak yapıştır
        disabled={false}
      />

      {/* Rich Text Toolbar */}
      <RichToolbar
        editor={richText}
        style={styles.toolbar}
        iconTint={Colors.black}
        selectedIconTint={Colors.primary}
        selectedButtonStyle={styles.selectedButton}
        iconSize={20}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertLink,
          actions.setStrikethrough,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
          actions.undo,
          actions.redo,
        ]}
        iconMap={{
          [actions.setBold]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-bold" size={20} color={tintColor} />
          ),
          [actions.setItalic]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-italic" size={20} color={tintColor} />
          ),
          [actions.setUnderline]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-underlined" size={20} color={tintColor} />
          ),
          [actions.insertBulletsList]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-list-bulleted" size={20} color={tintColor} />
          ),
          [actions.insertOrderedList]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-list-numbered" size={20} color={tintColor} />
          ),
          [actions.insertLink]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="insert-link" size={20} color={tintColor} />
          ),
          [actions.setStrikethrough]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-strikethrough" size={20} color={tintColor} />
          ),
          [actions.alignLeft]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-align-left" size={20} color={tintColor} />
          ),
          [actions.alignCenter]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-align-center" size={20} color={tintColor} />
          ),
          [actions.alignRight]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="format-align-right" size={20} color={tintColor} />
          ),
          [actions.undo]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="undo" size={20} color={tintColor} />
          ),
          [actions.redo]: ({ tintColor }: { tintColor?: string }) => (
            <MaterialIcons name="redo" size={20} color={tintColor} />
          ),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 8,
    backgroundColor: Colors.lightWhite,
    overflow: 'hidden',
  },
  editor: {
    backgroundColor: Colors.lightWhite,
  },
  editorContainer: {
    backgroundColor: Colors.lightWhite,
  },
  toolbar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectedButton: {
    backgroundColor: Colors.lightInput,
    borderRadius: 4,
  },
});

export default HtmlEditor;