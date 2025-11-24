import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  createVisitor,
  createConversation,
  sendMessage,
  getMessages,
  getNewMessages,
  getConversations,
  setTyping,
  checkAgentTyping,
} from '@/redux/actions/dialogfusionActions';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatBotProps {
  visible: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const {
    visitor,
    currentConversation,
    messages: dialogfusionMessages,
    conversations,
    loading: dialogfusionLoading,
    error: dialogfusionError,
  } = useSelector((state: RootState) => state.dialogfusion);

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [botStatus, setBotStatus] = useState<'online' | 'typing'>('online');
  const [isInitializing, setIsInitializing] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true); // Conversation listesi gösterilsin mi?
  const scrollViewRef = useRef<ScrollView>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentTypingCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // DialogFusion mesajlarını local Message formatına dönüştür
  const messages: Message[] = dialogfusionMessages.map((msg) => {
    const isUser = msg.user_id === visitor.user_id;
    return {
      id: msg.id,
      text: msg.message,
      isUser,
      timestamp: getCurrentTime(), // API'den timestamp gelmiyorsa şimdilik current time kullanıyoruz
    };
  });

  // Modal açıldığında initialization
  useEffect(() => {
    if (visible && user) {
      setShowConversationList(true); // Modal açıldığında conversation listesini göster
      initializeDialogFusion();
    } else if (!visible) {
      // Modal kapandığında polling'i durdur ve state'i temizle
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (agentTypingCheckIntervalRef.current) {
        clearInterval(agentTypingCheckIntervalRef.current);
        agentTypingCheckIntervalRef.current = null;
      }
      setShowConversationList(true); // Reset
      setInputText(''); // Input'u temizle
      setIsProcessing(false); // Processing state'ini sıfırla
      
      // Typing durumunu false yap
      if (currentConversation.conversation_id && visitor.user_id) {
        dispatch<any>(
          setTyping({
            conversation_id: currentConversation.conversation_id,
            user_id: visitor.user_id,
            is_typing: false,
          })
        );
      }
    }
  }, [visible, user]);

  // Polling: Yeni mesajları kontrol et (modal açıkken ve conversation varsa)
  useEffect(() => {
    // Önce mevcut polling'i temizle
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (visible && currentConversation.conversation_id && !isInitializing) {
      // Polling başlat (her 2 saniyede bir kontrol et)
      const startPolling = () => {
        pollingIntervalRef.current = setInterval(async () => {
          const currentConvId = currentConversation.conversation_id;
          if (!currentConvId) return;

          // Redux state'inden güncel mesajları al
          const currentMessages = dialogfusionMessages;
          
          if (currentMessages.length > 0) {
            // Son mesaj ID'sini ve datetime'ını al
            const lastMessage = currentMessages[currentMessages.length - 1];
            const lastMessageId = lastMessage?.id;
            const lastMessageDateTime = (lastMessage as any)?.creation_time;
            
            // Yeni mesajları kontrol et
            if (visitor.user_id) {
              await dispatch<any>(
                getNewMessages({
                  conversation_id: currentConvId,
                  user_id: visitor.user_id,
                  last_message_id: lastMessageId,
                  datetime: lastMessageDateTime,
                })
              );
              
              // Agent typing durumunu kontrol et
              const agentTypingResult = await dispatch<any>(
                checkAgentTyping({ conversation_id: currentConvId })
              );
              if (checkAgentTyping.fulfilled.match(agentTypingResult)) {
                setBotStatus(agentTypingResult.payload.is_typing ? 'typing' : 'online');
              }
            }
          } else {
            // Eğer mesaj yoksa tüm mesajları getir
            await dispatch<any>(
              getMessages({
                conversation_id: currentConvId,
              })
            );
          }
        }, 2000); // 2 saniyede bir kontrol et
      };

      // İlk kontrolü hemen yap, sonra polling başlat
      startPolling();
      
      // Agent typing durumunu kontrol et (her 2 saniyede bir)
      agentTypingCheckIntervalRef.current = setInterval(async () => {
        if (currentConversation.conversation_id) {
          const agentTypingResult = await dispatch<any>(
            checkAgentTyping({ conversation_id: currentConversation.conversation_id })
          );
          if (checkAgentTyping.fulfilled.match(agentTypingResult)) {
            setBotStatus(agentTypingResult.payload.is_typing ? 'typing' : 'online');
          }
        }
      }, 2000);
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (agentTypingCheckIntervalRef.current) {
        clearInterval(agentTypingCheckIntervalRef.current);
        agentTypingCheckIntervalRef.current = null;
      }
    };
  }, [visible, currentConversation.conversation_id, isInitializing]);

  // Mesajlar değiştiğinde scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Hata durumunda alert göster
  useEffect(() => {
    if (dialogfusionError) {
      Alert.alert(t('common.error'), dialogfusionError);
    }
  }, [dialogfusionError, t]);

  const initializeDialogFusion = async () => {
    if (!user || !user.email) {
      Alert.alert(t('common.error'), t('chatbot.error.userNotFound'));
        return;
      }

    setIsInitializing(true);

    try {
      // 1. Visitor oluştur veya mevcut visitor'ı kullan
      let userId: string | null = visitor.user_id;

      if (!userId) {
        const visitorResult = await dispatch<any>(
          createVisitor({
            first_name: user.name || t('chatbot.user'),
            last_name: user.surname || '',
            email: user.email,
            source: 'web',
          })
        );

        if (createVisitor.fulfilled.match(visitorResult)) {
          userId = visitorResult.payload.user_id?.toString() || null;
          if (!userId) {
            throw new Error(t('chatbot.error.userIdNotFound'));
          }
        } else {
          throw new Error(visitorResult.payload || t('chatbot.error.visitorNotCreated'));
        }
      }

      if (!userId) {
        throw new Error(t('chatbot.error.userIdNotFound'));
      }

      // 2. Konuşmaları getir
      const conversationsResult = await dispatch<any>(
        getConversations({ user_id: userId })
      );

      // Konuşmaları getirdikten sonra listeyi göster
      // Kullanıcı seçim yapacak veya yeni oluşturacak
      if (getConversations.fulfilled.match(conversationsResult)) {
        const convs = conversationsResult.payload.conversations;
        
        // Eğer konuşma yoksa direkt yeni oluştur ve chat ekranına geç
        if (!convs || convs.length === 0) {
          const conversationResult = await dispatch<any>(
            createConversation({
              user_id: userId,
              subject: t('chatbot.guestSupport'),
              source: 'web',
            })
          );

          if (createConversation.fulfilled.match(conversationResult)) {
            const conversationId = conversationResult.payload.conversation_id;
            // Mesajları getir ve chat ekranına geç
            await dispatch<any>(getMessages({ conversation_id: conversationId }));
            setShowConversationList(false); // Chat ekranını göster
    } else {
            throw new Error(conversationResult.payload || t('chatbot.error.conversationNotCreated'));
          }
        } else {
          // Konuşma varsa listeyi göster, kullanıcı seçim yapacak
          setShowConversationList(true);
        }
      } else {
        // Hata durumunda yeni konuşma oluştur
        const conversationResult = await dispatch<any>(
          createConversation({
            user_id: userId,
            subject: t('chatbot.guestSupport'),
            source: 'web',
          })
        );

        if (createConversation.fulfilled.match(conversationResult)) {
          const conversationId = conversationResult.payload.conversation_id;
          await dispatch<any>(getMessages({ conversation_id: conversationId }));
          setShowConversationList(false);
      } else {
          throw new Error(conversationResult.payload || t('chatbot.error.conversationNotCreated'));
        }
      }
    } catch (error: any) {
      console.error('DialogFusion initialization error:', error);
      Alert.alert(t('common.error'), error.message || t('chatbot.error.initializationError'));
    } finally {
      setIsInitializing(false);
    }
  };


  const handleSendText = async () => {
    if (!inputText.trim() || isProcessing) return;

    // Gerekli bilgileri kontrol et
    if (!visitor.user_id || !currentConversation.conversation_id) {
      Alert.alert(t('common.error'), t('chatbot.pleaseWait'));
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
      setIsProcessing(true);
      setBotStatus('typing');

    try {
      // Mesajı gönder
      const sendResult = await dispatch<any>(
        sendMessage({
          conversation_id: currentConversation.conversation_id,
          user_id: visitor.user_id,
          message: messageText,
        })
      );

      if (sendMessage.fulfilled.match(sendResult)) {
        // Typing durumunu false yap (mesaj gönderildi)
        if (currentConversation.conversation_id && visitor.user_id) {
          dispatch<any>(
            setTyping({
              conversation_id: currentConversation.conversation_id,
              user_id: visitor.user_id,
              is_typing: false,
            })
          );
        }
        
        // Typing timeout'unu temizle
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        
        // Mesaj gönderildi, hemen yeni mesajları kontrol et
        // Polling zaten çalışıyor ama hemen kontrol edelim
        setTimeout(async () => {
          if (currentConversation.conversation_id && visitor.user_id) {
            const lastMessage = dialogfusionMessages.length > 0 
              ? dialogfusionMessages[dialogfusionMessages.length - 1] 
              : undefined;
            const lastMessageId = lastMessage?.id;
            const lastMessageDateTime = (lastMessage as any)?.creation_time;
            
            await dispatch<any>(
              getNewMessages({
                conversation_id: currentConversation.conversation_id,
                user_id: visitor.user_id,
                last_message_id: lastMessageId,
                datetime: lastMessageDateTime,
              })
            );
          }
          setBotStatus('online');
        }, 500); // 500ms sonra kontrol et
      } else {
        throw new Error(sendResult.payload || t('chatbot.error.messageNotSent'));
      }
    } catch (error: any) {
      console.error('Mesaj gönderme hatası:', error);
      Alert.alert(t('common.error'), error.message || t('chatbot.error.messageSendError'));
      setBotStatus('online');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTodayLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    // Basit bir kontrol - gerçek uygulamada daha detaylı olabilir
    return t('chatbot.today');
  };

  // Conversation seçildiğinde
  const handleSelectConversation = async (conversationId: string) => {
    if (!conversationId) {
      Alert.alert(t('common.error'), t('chatbot.error.invalidConversationId'));
      return;
    }

    setIsInitializing(true);
    try {
      console.log('🔍 [ChatBot] Conversation seçiliyor:', conversationId);
      
      // Conversation'ı seç
      dispatch({
        type: 'dialogfusion/selectConversation',
        payload: {
          conversation_id: String(conversationId),
          user_id: visitor.user_id || null,
        },
      });

      // Kısa bir bekleme - reducer'ın state'i güncellemesi için
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mesajları getir
      await dispatch<any>(getMessages({ conversation_id: String(conversationId) }));
      
      // Chat ekranına geç
      setShowConversationList(false);
    } catch (error: any) {
      console.error('Conversation seçme hatası:', error);
      Alert.alert(t('common.error'), error.message || t('chatbot.error.conversationLoadError'));
    } finally {
      setIsInitializing(false);
    }
  };

  // Yeni conversation oluştur
  const handleCreateNewConversation = async () => {
    if (!visitor.user_id) {
      Alert.alert(t('common.error'), t('chatbot.error.userNotFound'));
      return;
    }

    setIsInitializing(true);
    try {
      const conversationResult = await dispatch<any>(
        createConversation({
          user_id: visitor.user_id,
          subject: t('chatbot.guestSupport'),
          source: 'web',
        })
      );

      if (createConversation.fulfilled.match(conversationResult)) {
        const conversationId = conversationResult.payload.conversation_id;
        // Mesajları getir ve chat ekranına geç
        await dispatch<any>(getMessages({ conversation_id: conversationId }));
        setShowConversationList(false);
      } else {
        throw new Error(conversationResult.payload || t('chatbot.error.conversationNotCreated'));
      }
    } catch (error: any) {
      console.error('Yeni conversation oluşturma hatası:', error);
      Alert.alert(t('common.error'), error.message || t('chatbot.error.conversationNotCreated'));
    } finally {
      setIsInitializing(false);
    }
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // API'den gelen format: "2025-11-11 16:29:23" veya "conversation_creation_time"
      let date: Date;
      
      // Eğer "conversation_creation_time" formatındaysa
      if (dateString.includes(' ')) {
        // "YYYY-MM-DD HH:mm:ss" formatını parse et
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        date = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        date = new Date(dateString);
      }

      // Invalid date kontrolü
      if (isNaN(date.getTime())) {
        console.warn('⚠️ [ChatBot] Invalid date:', dateString);
        return '';
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Aynı gün mü kontrol et
      const isToday = date.toDateString() === now.toDateString();
      const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

      if (isToday) {
        return t('chatbot.today');
      } else if (isYesterday) {
        return t('chatbot.yesterday');
      } else if (diffDays <= 7) {
        return t('chatbot.daysAgo', { count: diffDays });
        } else {
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
        }
      } catch (error) {
      console.warn('⚠️ [ChatBot] Tarih formatlama hatası:', dateString, error);
      return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <LinearGradient
            colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerLeft}>
              {!showConversationList && (
                <TouchableOpacity
                  onPress={() => setShowConversationList(true)}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
              )}
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons 
                    name={showConversationList ? "message-text" : "robot"} 
                    size={24} 
                    color={Colors.purple} 
                  />
                </View>
                {!showConversationList && botStatus === 'online' && (
                  <View style={styles.onlineIndicator} />
                )}
              </View>
              <View style={styles.headerTextContainer}>
                <ReusableText
                  text={showConversationList ? t('chatbot.conversations') : (currentConversation.subject || t('chatbot.bot'))}
                  family="bold"
                  size={FontSizes.medium}
                  color={Colors.white}
                />
                {!showConversationList && (
                  botStatus === 'typing' ? (
                  <ReusableText
                    text={t('chatbot.typing')}
                    family="regular"
                    size={FontSizes.xSmall}
                    color={Colors.white}
                  />
                ) : (
                  <ReusableText
                    text={t('chatbot.online')}
                    family="regular"
                    size={FontSizes.xSmall}
                    color={Colors.white}
                  />
                  )
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Conversation List Screen */}
          {showConversationList && (
            <View style={styles.conversationListContainer}>
              <ScrollView
                style={styles.conversationList}
                contentContainerStyle={styles.conversationListContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Loading State */}
                {isInitializing && conversations.length === 0 && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <ReusableText
                      text={t('chatbot.loading')}
                      family="regular"
                      size={FontSizes.small}
                      color={Colors.description}
                      style={styles.loadingText}
                    />
                  </View>
                )}

                {/* Yeni Conversation Butonu */}
                <TouchableOpacity
                  style={styles.newConversationButton}
                  onPress={handleCreateNewConversation}
                  disabled={isInitializing}
                >
                  <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                  <ReusableText
                    text={t('chatbot.newConversation')}
                    family="bold"
                    size={FontSizes.medium}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                  {/* Conversation List */}
                  {conversations.length > 0 && (
                    <View key="conversation-list-wrapper">
                      <View style={styles.conversationListHeader}>
                        <ReusableText
                          text={t('chatbot.pastConversations')}
                          family="bold"
                          size={FontSizes.medium}
                          color={Colors.black}
                        />
                      </View>

                      {conversations.map((conv) => {
                        const convId = conv.id || (conv as any).conversation_id || String((conv as any).id);
                        if (!convId) {
                          console.warn('⚠️ [ChatBot] Conversation ID bulunamadı:', conv);
                          return null;
                        }
                        
                        return (
                          <TouchableOpacity
                            key={convId}
                            style={styles.conversationItem}
                            onPress={() => handleSelectConversation(convId)}
                            disabled={isInitializing}
                          >
                            <View style={styles.conversationItemContent}>
                              <View style={styles.conversationItemLeft}>
                                <View style={styles.conversationAvatar}>
                                  <MaterialCommunityIcons name="message-text" size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.conversationItemText}>
                                  <ReusableText
                                    text={(conv as any).title || conv.subject || t('chatbot.chat')}
                                    family="bold"
                                    size={FontSizes.small}
                                    color={Colors.black}
                                  />
                                  <ReusableText
                                    text={formatDate((conv as any).conversation_creation_time || conv.creation_time || '')}
                                    family="regular"
                                    size={FontSizes.xSmall}
                                    color={Colors.description}
                                  />
                                </View>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color={Colors.description} />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
              </ScrollView>
            </View>
          )}

          {/* Chat Area */}
          {!showConversationList && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Loading State */}
            {isInitializing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <ReusableText
                  text={t('chatbot.connecting')}
                  family="regular"
                  size={FontSizes.small}
                  color={Colors.description}
                  style={styles.loadingText}
                />
              </View>
            )}

            {/* Date Separator */}
            {!isInitializing && (
            <View style={styles.dateSeparator}>
              <ReusableText
                text={getTodayLabel()}
                family="regular"
                size={FontSizes.small}
                color={Colors.description}
              />
            </View>
            )}

            {/* Messages */}
            {!isInitializing && messages.length === 0 && (
              <View style={styles.emptyState}>
                <ReusableText
                  text={t('chatbot.welcomeMessage')}
                  family="regular"
                  size={FontSizes.medium}
                  color={Colors.description}
                />
              </View>
            )}

            {!isInitializing && messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessageContainer : styles.botMessageContainer,
                ]}
              >
                {!message.isUser && (
                  <View style={styles.botAvatar}>
                    <MaterialCommunityIcons name="robot" size={20} color={Colors.lightGray} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {message.text && (
                    <ReusableText
                      text={message.text}
                      family="regular"
                      size={FontSizes.small}
                      color={message.isUser ? Colors.black : Colors.black}
                    />
                  )}
                </View>
                <ReusableText
                  text={message.timestamp}
                  family="regular"
                  size={FontSizes.xxSmall}
                  color={Colors.description}
                  style={styles.timestamp}
                />
              </View>
            ))}

            {!isInitializing && isProcessing && (
              <View style={styles.botMessageContainer}>
                <View style={styles.botAvatar}>
                  <MaterialCommunityIcons name="robot" size={20} color={Colors.lightGray} />
                </View>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              </View>
            )}
          </ScrollView>
          )}

          {/* Input Area - Sadece chat ekranında göster */}
          {!showConversationList && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('chatbot.writeMessage')}
              placeholderTextColor={Colors.description}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                
                // Kullanıcı yazıyor durumunu gönder
                if (currentConversation.conversation_id && visitor.user_id) {
                  // Önceki timeout'u temizle
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
                  
                  // Typing durumunu gönder
                  dispatch<any>(
                    setTyping({
                      conversation_id: currentConversation.conversation_id,
                      user_id: visitor.user_id,
                      is_typing: true,
                    })
                  );
                  
                  // 3 saniye sonra typing durumunu false yap (kullanıcı yazmayı bıraktı)
                  typingTimeoutRef.current = setTimeout(() => {
                    if (currentConversation.conversation_id && visitor.user_id) {
                      dispatch<any>(
                        setTyping({
                          conversation_id: currentConversation.conversation_id,
                          user_id: visitor.user_id,
                          is_typing: false,
                        })
                      );
                    }
                  }, 3000);
                }
              }}
              multiline
              maxLength={500}
              editable={!isProcessing && !isInitializing}
            />
            <View style={styles.inputIcons}>
              {inputText.trim() && (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendText}
                  disabled={isProcessing || isInitializing}
                >
                  <Ionicons name="send" size={20} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          )}

          {/* Footer Branding */}
          {!showConversationList && (
          <View style={styles.footer}>
            <ReusableText
              text={t('chatbot.branding')}
              family="regular"
              size={FontSizes.xSmall}
              color={Colors.description}
            />
          </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.green,
  },
  headerTextContainer: {
    gap: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: Colors.backgroundBox,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.backgroundBox,
  },
  botBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  timestamp: {
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundBox,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSizes.small,
    color: Colors.black,
    maxHeight: 100,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  conversationListContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  conversationList: {
    flex: 1,
  },
  conversationListContent: {
    padding: 16,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  conversationListHeader: {
    marginBottom: 12,
  },
  conversationItem: {
    backgroundColor: Colors.backgroundBox,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  conversationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  conversationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItemText: {
    flex: 1,
    gap: 4,
  },
});

export default ChatBot;

