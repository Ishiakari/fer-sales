import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { theme } from '../constants/theme';
import { BackArrowIcon } from '../components/icons/Icons';
import { askSalesAssistant } from '../services/aiServer';

const AI_AVATAR_IMAGE = require('../../assets/images/ai-avatar.png');

// SVG Sparkle Icon for Gemini Avatar/Badges
const SparkleIcon = ({ size = 18, color = theme.colors.primaryOrange }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={color} />
  </Svg>
);

// SVG Trash/Clear Icon
const TrashIcon = ({ size = 20, color = theme.colors.textGray }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Svg>
);

// SVG Send Arrow Icon
const SendIcon = ({ size = 20, color = theme.colors.cardIvory }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 2L11 13" />
    <Path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </Svg>
);

// SVG Chart Icon
const ChartIcon = ({ size = 16, color = theme.colors.primaryOrange }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);

// SVG Award/Best Seller Icon
const AwardIcon = ({ size = 16, color = theme.colors.primaryOrange }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="7" />
    <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </Svg>
);

// SVG Lightbulb/Tip Icon
const LightbulbIcon = ({ size = 16, color = theme.colors.primaryOrange }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .5 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
    <Line x1="9" y1="18" x2="15" y2="18" />
    <Line x1="10" y1="22" x2="14" y2="22" />
  </Svg>
);

// SVG Chat/Chika Icon
const ChatIcon = ({ size = 16, color = theme.colors.primaryOrange }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export default function AIAssistant() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      text: "Kumusta! Ako si Gemini, imong personal FerSales AI assistant. I can chat in **English**, **Tagalog**, or **Bisaya**! Ask me anything about your sales, inventory, or let's just chat!" 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('.');

  // Bouncing dots effect for thinking state
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setTypingText(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 450);
    return () => clearInterval(interval);
  }, [loading]);

  // Auto-scroll to bottom on new messages or loading change
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim()) return;
    const userMsg = rawText.trim();
    
    // Clear typing input if sent from text input
    if (!textToSend) {
      setInputText('');
    }
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const response = await askSalesAssistant(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Oops, connection issue. Please verify your internet and API Key in the .env file!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { 
        role: 'ai', 
        text: "Chat cleared! Ask me anything—in **Bisaya**, **Tagalog**, or **English**. How can I help you today?" 
      }
    ]);
  };

  // Basic Markdown-like bold formatting parser (**text** => bold)
  const renderFormattedText = (text: string, isUser: boolean) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={index} style={styles.boldText}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  // Quick prompt suggestion chips
  const suggestionChips = [
    { 
      label: 'Halin Karon (Sales Today)', 
      text: 'Pila ang total sales nako karon ug pila ka orders?',
      icon: <ChartIcon /> 
    },
    { 
      label: 'Unsay Best Seller?', 
      text: 'Unsay pinakahalin nako nga item sukad sa sugod?',
      icon: <AwardIcon /> 
    },
    { 
      label: 'Tip para sa Sales', 
      text: 'Hatagi ko og maayong tips unsaon pagpadaghan sa akong halin.',
      icon: <LightbulbIcon /> 
    },
    { 
      label: 'General Chika', 
      text: 'Kumusta ka, Gemini? Mag-chika ta sa Bisaya!',
      icon: <ChatIcon /> 
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <BackArrowIcon color={theme.colors.textDark} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Image source={AI_AVATAR_IMAGE} style={styles.headerAvatarImage} />
            <Text style={styles.headerTitle}>Sales Brain AI</Text>
          </View>

          <TouchableOpacity onPress={handleClearChat} style={styles.clearButton} activeOpacity={0.7}>
            <TrashIcon size={20} color={theme.colors.textGray} />
          </TouchableOpacity>
        </View>

        {/* Messages list */}
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <View key={index} style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
                {!isUser && (
                  <Image source={AI_AVATAR_IMAGE} style={styles.aiAvatarImage} />
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                  {!isUser && <Text style={styles.senderLabel}>Gemini Assistant</Text>}
                  {renderFormattedText(msg.text, isUser)}
                </View>
              </View>
            );
          })}
          
          {loading && (
            <View style={[styles.messageRow, styles.aiRow]}>
              <Image source={AI_AVATAR_IMAGE} style={styles.aiAvatarImage} />
              <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                <Text style={styles.senderLabel}>Gemini Assistant</Text>
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Gemini is thinking{typingText}</Text>
                  <ActivityIndicator size="small" color={theme.colors.primaryOrange} style={{ marginLeft: 8 }} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Chips */}
        {messages.length === 1 && !loading && (
          <View style={styles.suggestionsWrapper}>
            <Text style={styles.suggestionsTitle}>💡 Quick Starter Prompts:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.suggestionsContainer}
            >
              {suggestionChips.map((chip, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(chip.text)}
                  activeOpacity={0.8}
                >
                  <View style={styles.chipContent}>
                    {chip.icon}
                    <Text style={styles.suggestionChipText}>{chip.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Pangutana o pakig-chika diri..."
              placeholderTextColor={theme.colors.textGray}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              multiline
              maxLength={400}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={() => handleSend()} 
              disabled={loading || !inputText.trim()}
              activeOpacity={0.8}
            >
              <SendIcon size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: theme.colors.backgroundCream 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: theme.spacing.lg, 
    paddingTop: theme.spacing.xl, 
    backgroundColor: theme.colors.cardIvory, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: theme.colors.backgroundCream, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: theme.typography.fontWeight.bold, 
    color: theme.colors.primaryOrange 
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.backgroundCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  chatContainer: { 
    padding: theme.spacing.lg, 
    paddingBottom: 30 
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.colors.primaryOrange,
  },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryOrange,
  },
  messageBubble: { 
    maxWidth: '80%', 
    padding: 14, 
    borderRadius: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: { 
    backgroundColor: theme.colors.primaryOrange, 
    borderBottomRightRadius: 4,
  },
  aiBubble: { 
    backgroundColor: theme.colors.cardIvory, 
    borderBottomLeftRadius: 4, 
    borderWidth: 1, 
    borderColor: theme.colors.borderLight 
  },
  loadingBubble: {
    minWidth: 150,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textGray,
    marginBottom: 4,
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 22 
  },
  userText: { 
    color: theme.colors.cardIvory 
  },
  aiText: { 
    color: theme.colors.textDark 
  },
  boldText: {
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textGray,
  },
  suggestionsWrapper: {
    paddingVertical: 10,
    backgroundColor: theme.colors.backgroundCream,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textGray,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 8,
  },
  suggestionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FAEEE4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1DCC9',
  },
  suggestionChipText: {
    color: theme.colors.primaryOrange,
    fontSize: 14,
    fontWeight: '600',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputWrapper: {
    backgroundColor: theme.colors.cardIvory,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    padding: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 24 : theme.spacing.md,
  },
  inputContainer: { 
    flexDirection: 'row', 
    backgroundColor: theme.colors.backgroundCream, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: theme.colors.borderLight, 
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  input: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 16, 
    color: theme.colors.textDark,
    maxHeight: 100,
  },
  sendButton: { 
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryOrange, 
    justifyContent: 'center', 
    alignItems: 'center',
    margin: 4,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textGray,
    opacity: 0.5,
  },
});
