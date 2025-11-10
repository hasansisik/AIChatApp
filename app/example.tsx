import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { Colors } from '@/hooks/useThemeColor';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const ExamplePage = () => {
  const router = useRouter();
  const url = 'http://13.61.190.210:8080/stream/c6b02660-9c67-49c1-a177-e01ebf9e0ab2';
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Stream URL'leri için loading'i maksimum 5 saniye sonra kaldır
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    // Loading'i hemen kaldır
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(false);
  };

  const handleError = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        hidden={true}
      />
      
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleError}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="always"
        allowsFullscreenVideo={true}
        scalesPageToFit={true}
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            // Viewport meta tag ekle - sayfa yüklenmeden önce
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            document.head.appendChild(meta);
          })();
          true;
        `}
        injectedJavaScript={`
          (function() {
            // Viewport meta tag güncelle
            var viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
              viewport = document.createElement('meta');
              viewport.name = 'viewport';
              viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
              document.head.appendChild(viewport);
            } else {
              viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
            
            // CSS stillerini ekle
            var style = document.createElement('style');
            style.id = 'fullscreen-styles';
            style.innerHTML = \`
              * {
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              html {
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: black !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                -webkit-overflow-scrolling: touch !important;
              }
              body {
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: black !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                -webkit-overflow-scrolling: touch !important;
              }
              video, iframe, canvas, img {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                object-fit: cover !important;
                object-position: center !important;
                background: black !important;
                border: none !important;
              }
            \`;
            
            // Eski stil varsa kaldır
            var oldStyle = document.getElementById('fullscreen-styles');
            if (oldStyle) {
              oldStyle.remove();
            }
            document.head.appendChild(style);
            
            // HTML ve body stillerini doğrudan uygula
            document.documentElement.style.width = '100vw';
            document.documentElement.style.height = '100vh';
            document.documentElement.style.margin = '0';
            document.documentElement.style.padding = '0';
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.position = 'fixed';
            document.documentElement.style.top = '0';
            document.documentElement.style.left = '0';
            document.documentElement.style.right = '0';
            document.documentElement.style.bottom = '0';
            
            if (document.body) {
              document.body.style.width = '100vw';
              document.body.style.height = '100vh';
              document.body.style.margin = '0';
              document.body.style.padding = '0';
              document.body.style.overflow = 'hidden';
              document.body.style.position = 'fixed';
              document.body.style.top = '0';
              document.body.style.left = '0';
              document.body.style.right = '0';
              document.body.style.bottom = '0';
            }
            
            // Tüm medya elementlerini güncelle
            function updateMediaElements() {
              var elements = document.querySelectorAll('video, iframe, canvas, img');
              elements.forEach(function(el) {
                el.style.position = 'absolute';
                el.style.top = '0';
                el.style.left = '0';
                el.style.width = '100vw';
                el.style.height = '100vh';
                el.style.objectFit = 'cover';
                el.style.objectPosition = 'center';
                el.style.background = 'black';
                if (el.tagName === 'IFRAME') {
                  el.style.border = 'none';
                }
              });
            }
            
            // İlk güncelleme
            updateMediaElements();
            
            // DOM değişikliklerini izle
            var observer = new MutationObserver(function(mutations) {
              updateMediaElements();
            });
            
            observer.observe(document.body || document.documentElement, {
              childList: true,
              subtree: true
            });
            
            // Sayfa yüklendiğinde tekrar güncelle
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', updateMediaElements);
            } else {
              updateMediaElements();
            }
            
            // Window resize'da güncelle
            window.addEventListener('resize', updateMediaElements);
          })();
          true;
        `}
        onMessage={() => {}}
      />
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleGoBack}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          color={Colors.white}
          size={24}
        />
      </TouchableOpacity>

      {isLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: Colors.black,
  },
  webview: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: Colors.black,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
    width: screenWidth,
    height: screenHeight,
  },
});

export default ExamplePage;

