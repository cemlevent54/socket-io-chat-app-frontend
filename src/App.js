import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import messageApi from './api/messageApi';
import userApi from './api/userApi';
import './App.css';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

const SOCKET_SERVER_URL = 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  
  // API Test için yeni state'ler
  const [apiTestMode, setApiTestMode] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [testUserId, setTestUserId] = useState('');
  const [apiMessages, setApiMessages] = useState([]);
  const [userChats, setUserChats] = useState([]);
  const [chatParticipants, setChatParticipants] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  
  // Socket.IO için eksik state'ler
  const [socketLoading, setSocketLoading] = useState(false);
  const [socketMessages, setSocketMessages] = useState([]);

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Socket.IO bağlantısını kur
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket.IO bağlandı:', newSocket.id);
      setIsConnected(true);
      setError('');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO bağlantısı kesildi');
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    newSocket.on('error', (error) => {
      console.error('🔌 Socket.IO hatası:', error);
      setError(error.message);
    });

    // Chat event'leri
    newSocket.on('chat_joined', (data) => {
      console.log('✅ Chat odasına katıldınız:', data);
      console.log('Kullanıcı oda bilgisi (chat_joined):', data);
      setIsAuthenticated(true);
      setError('');
    });

    // Mesaj alma event'i
    newSocket.on('receive_chat_message', (data) => {
      console.log('📨 Mesaj alındı:', data);
      // Kendi gönderdiğimiz mesajları tekrar ekleme
      if (data.senderId === userInfo?.userId) {
        console.log('🔄 Kendi mesajım, tekrar eklenmiyor');
        return;
      }
      
      const newMessage = {
        id: data.message.id,
        content: data.message.content,
        senderId: data.senderId,
        timestamp: data.message.formatted_created_at || data.message.created_at || data.timestamp,
        createdAt: new Date().toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isOwn: false,
        status: 'sent',
        senderName: data.message.sender_name,
        isRead: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Sohbet listesini güncelle - son mesaj bilgisini güncelle
      setUserChats(prev => prev.map(chat => {
        // Bu mesajın hangi chat'e ait olduğunu bul
        const isThisChat = (chat.sender_id === data.senderId && chat.receiver_id === userInfo?.userId) ||
                          (chat.receiver_id === data.senderId && chat.sender_id === userInfo?.userId);
        
        if (isThisChat) {
          return {
            ...chat,
            last_message: data.message.content,
            last_message_time: new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            unread_count: (chat.unread_count || 0) + 1
          };
        }
        return chat;
      }));
    });

    // Mesaj gönderme başarılı event'i
    newSocket.on('message_sent_success', (data) => {
      console.log('✅ Mesaj başarıyla gönderildi:', data);
      // Gönderilen mesajın durumunu güncelle
      setMessages(prev => prev.map(msg =>
        msg.content === data.message.content && msg.status === 'sending'
          ? { 
              ...msg, 
              status: 'sent', 
              id: data.message.id, 
              timestamp: data.message.formatted_created_at || data.message.created_at || data.timestamp,
              createdAt: new Date().toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              isRead: false
            }
          : msg
      ));
      
      // Sohbet listesini güncelle - mesaj başarıyla gönderildi
      setUserChats(prev => prev.map(chat => 
        chat.id === roomId 
          ? { 
              ...chat, 
              last_message: data.message.content,
              last_message_time: new Date().toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          : chat
      ));
    });

    // Mesaj gönderme hatası event'i
    newSocket.on('message_send_error', (data) => {
      console.error('❌ Mesaj gönderme hatası:', data);
      setError(`Mesaj gönderilemedi: ${data.message}`);
      
      // Hatalı mesajı kaldır
      setMessages(prev => prev.filter(msg => msg.status !== 'sending'));
    });

    newSocket.on('user_joined_chat', (data) => {
      console.log('👤 Yeni kullanıcı katıldı:', data);
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: `${data.userId} sohbete katıldı`,
        type: 'system',
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('user_left_chat', (data) => {
      console.log('👤 Kullanıcı ayrıldı:', data);
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: `${data.userId} sohbetten ayrıldı`,
        type: 'system',
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('user_typing_in_chat', (data) => {
      console.log('✍️ Typing event received:', data);
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
          userId: data.userId,
          userRole: data.userRole
        }]);
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    newSocket.on('message_read', (data) => {
      console.log('👁️ Mesaj okundu:', data);
      // Mesajları güncelle - okundu durumunu işaretle
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId || msg.content === data.messageContent
          ? { ...msg, isRead: true, status: 'read' }
          : msg
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Chat odasına katıl
  const joinRoom = () => {
    if (!roomId.trim() || !bearerToken.trim()) {
      setError('Oda numarası ve Bearer token gereklidir');
      return;
    }

    if (!socket) {
      setError('Socket bağlantısı kurulamadı');
      return;
    }

    // Yeni odaya katılırken eski mesajları temizle
    setMessages([]);
    setApiMessages([]);

    // Token'dan kullanıcı bilgilerini çıkar (JWT decode)
    try {
      const tokenPayload = JSON.parse(atob(bearerToken.split('.')[1]));
      const userInfo = {
        userId: tokenPayload.id || tokenPayload.userId || 'user_' + Date.now(),
        userRole: tokenPayload.role || 'user'
      };
      setUserInfo(userInfo);

      // API token'ını ayarla
      messageApi.setToken(bearerToken);

      // Karşı tarafın id'sini bul
      const activeChat = userChats.find(chat => chat.id === roomId);
      let receiverId = null;
      if (activeChat) {
        receiverId = activeChat.sender_id === userInfo.userId
          ? activeChat.receiver_id
          : activeChat.sender_id;
      }
      if (!receiverId) {
        setError('Karşı tarafın ID\'si bulunamadı');
        return;
      }
      // Socket odası için iki userId'den oluşan id
      const chatSocketId = [userInfo.userId, receiverId].sort().join('_');
      console.log('joinRoom çağrıldı. Kullanıcı:', userInfo.userId, 'Oda (roomId):', roomId, 'Karşı taraf (receiverId):', receiverId, 'Socket chatId:', chatSocketId);
      socket.emit('authenticate_and_join', {
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        receiverId,
        chatSocketId
      });

      setError('');
      console.log('🚀 Chat odasına katılma isteği gönderildi:', {
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        receiverId,
        chatSocketId
      });
    } catch (error) {
      setError('Geçersiz token formatı');
      console.error('Token decode hatası:', error);
    }
  };

  // UUID validasyon fonksiyonu
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Socket.IO ile mesaj gönder
  const sendSocketMessage = () => {
    if (!newMessage.trim() || !roomId.trim()) {
      setError('Mesaj ve oda ID gereklidir');
      return;
    }

    if (!socket || !isAuthenticated) {
      setError('Socket bağlantısı veya kimlik doğrulama yok');
      return;
    }

    setSocketLoading(true);

    // Karşı tarafın id'sini bul
    const activeChat = userChats.find(chat => chat.id === roomId);
    let receiverId = null;
    if (activeChat) {
      receiverId = activeChat.sender_id === userInfo.userId
        ? activeChat.receiver_id
        : activeChat.sender_id;
    }
    if (!receiverId) {
      setError('Karşı tarafın ID\'si bulunamadı');
      setSocketLoading(false);
      return;
    }

    // Mesajı önce local state'e ekle (optimistic update)
    const tempMessage = {
      id: Date.now(),
      content: newMessage,
      senderId: userInfo?.userId,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isOwn: true,
      status: 'sending',
      senderName: userInfo?.email || 'Sen',
      isRead: false
    };
    
    // Mesajı hemen ekle ve input'u temizle
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setError('');

    try {
      console.log('🚀 Socket.IO mesaj gönderme:', {
        content: newMessage,
        receiverId, // chatId değil!
        senderRole: userInfo?.userRole
      });

      socket.emit('send_chat_message', {
        content: newMessage,
        receiverId, // chatId değil!
        senderRole: userInfo?.userRole
      });

      // Sohbet listesini güncelle - son mesaj bilgisini güncelle
      setUserChats(prev => prev.map(chat => 
        chat.id === roomId 
          ? { 
              ...chat, 
              last_message: newMessage,
              last_message_time: new Date().toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          : chat
      ));

    } catch (error) {
      console.error('❌ Socket.IO mesaj gönderme hatası:', error);
      setError(`Socket Hatası: ${error.message}`);
      // Hata durumunda mesajı kaldır ve input'a geri koy
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(newMessage);
    } finally {
      setSocketLoading(false);
    }
  };

  // API ile mesaj gönder
  const sendApiMessage = async () => {
    if (!newMessage.trim() || !receiverId.trim()) {
      setError('Mesaj ve alıcı ID gereklidir');
      return;
    }

    // UUID validasyonu
    const cleanReceiverId = receiverId.trim();
    if (!isValidUUID(cleanReceiverId)) {
      setError('Geçersiz alıcı ID formatı. UUID formatında olmalıdır.');
      return;
    }

    setApiLoading(true);
    try {
      console.log('🚀 API mesaj gönderme isteği:', {
        content: newMessage,
        receiverId: cleanReceiverId,
        token: userInfo?.token ? 'Bearer [HIDDEN]' : 'No token'
      });
      
      const result = await messageApi.sendMessage(newMessage, cleanReceiverId);
      console.log('✅ API mesaj gönderildi:', result);
      
      // API mesajlarını güncelle
      setApiMessages(prev => [...prev, {
        id: Date.now(),
        content: newMessage,
        senderId: userInfo?.userId,
        timestamp: new Date().toISOString(),
        isOwn: true,
        apiResponse: result
      }]);
      
      setNewMessage('');
      setError('');
    } catch (error) {
      console.error('❌ API mesaj gönderme hatası:', error);
      setError(`API Hatası: ${error.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  // Sohbetleri yükleyen fonksiyonu güncelle (admin ve user ayrımı)
  const loadUserChats = () => {
    setApiLoading(true);
    if (userInfo?.role === 'admin') {
      messageApi.getAdminChats()
        .then(res => setUserChats(res.data || []))
        .catch(err => setError(err.message))
        .finally(() => setApiLoading(false));
    } else {
      messageApi.fetchUserChats({
        onSuccess: (res) => setUserChats(res.data || []),
        onError: (err) => setError(err),
        onFinally: () => setApiLoading(false)
      });
    }
  };

  // Chat mesajlarını yükleyen fonksiyonu güncelle (admin ve user ayrımı)
  const loadChatMessages = async () => {
    if (!roomId || !roomId.trim()) {
      setError('Chat ID gereklidir');
      return;
    }
    setApiLoading(true);
    console.log('Mesajlar yükleniyor, chatId:', roomId);
    console.log('userInfo:', userInfo);
    
    try {
      let result;
      if (userInfo?.role === 'admin') {
        result = await messageApi.getAdminChatMessages(roomId);
      } else {
        result = await messageApi.getChatMessages(roomId);
      }
      console.log('API mesaj sonucu:', result);
      setApiMessages(result.data || []);
      setError('');
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
      if (error.message && error.message.includes('404')) {
        setApiMessages([]);
        setError('');
      } else {
        setError(`Mesajlar yüklenirken hata: ${error.message}`);
      }
    } finally {
      setApiLoading(false);
    }
  };

  // Chat katılımcılarını getir
  const loadChatParticipants = async () => {
    if (!roomId.trim()) {
      setError('Chat ID gereklidir');
      return;
    }

    setApiLoading(true);
    try {
      const result = await messageApi.getChatParticipants(roomId);
      setChatParticipants(result.data || []);
      console.log('✅ Chat katılımcıları yüklendi:', result);
    } catch (error) {
      setError(`Katılımcılar yüklenirken hata: ${error.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  // Admin: Kullanıcıya mesaj gönder
  const sendMessageToUser = async () => {
    if (!newMessage.trim() || !testUserId.trim()) {
      setError('Mesaj ve test kullanıcı ID gereklidir');
      return;
    }

    setApiLoading(true);
    try {
      const result = await messageApi.sendMessageToUser(testUserId, newMessage);
      console.log('✅ Kullanıcıya mesaj gönderildi:', result);
      
      setApiMessages(prev => [...prev, {
        id: Date.now(),
        content: newMessage,
        receiverId: testUserId,
        timestamp: new Date().toISOString(),
        isOwn: true,
        apiResponse: result
      }]);
      
      setNewMessage('');
      setError('');
    } catch (error) {
      setError(`Kullanıcıya mesaj gönderme hatası: ${error.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  // Yazıyor göstergesi
  const handleTyping = (isTyping) => {
    if (socket && isAuthenticated && roomId && userInfo) {
      const activeChat = userChats.find(chat => chat.id === roomId);
      let receiverId = null;
      if (activeChat) {
        receiverId = activeChat.sender_id === userInfo.userId
          ? activeChat.receiver_id
          : activeChat.sender_id;
      }
      if (!receiverId) return;
      const chatSocketId = [userInfo.userId, receiverId].sort().join('_');
      console.log('✍️ Typing emit:', { userId: userInfo.userId, roomId, receiverId, chatSocketId, isTyping });
      socket.emit('typing_in_chat', {
        receiverId,
        isTyping,
        chatSocketId
      });
    }
  };

  // Enter tuşu ile mesaj gönder
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (apiTestMode) {
        sendApiMessage();
      } else {
        sendSocketMessage();
      }
    }
  };

  // Chat odasından ayrıl
  const leaveRoom = () => {
    if (socket && isAuthenticated) {
      socket.emit('leave_chat', { chatId: roomId });
      setIsAuthenticated(false);
      setMessages([]);
      setApiMessages([]);
      setTypingUsers([]);
      setUserInfo(null);
    }
  };

  // Gerçek login fonksiyonu (API ile)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await userApi.login(email, password);
      const token = result.data?.accessToken || result.data?.token;
      if (result.success && result.data && token) {
        setUser({ email, ...result.data.user });
        setBearerToken(token);
        userApi.setToken(token);
        messageApi.setToken(token);
        setError('');
        // JWT decode ile userInfo'yu set et
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          setUserInfo({
            userId: tokenPayload.id,
            userRole: tokenPayload.role,
            email: tokenPayload.email
          });
        } catch (err) {
          setUserInfo({
            userId: result.data.user.id,
            userRole: result.data.user.role,
            email: result.data.user.email
          });
        }
        // Login sonrası sohbetleri yükle
        messageApi.fetchUserChats({
          onSuccess: (res) => setUserChats(res.data || []),
          onError: (err) => setError(err),
        });
      } else {
        setError(result.message || 'Giriş başarısız');
      }
    } catch (err) {
      setError(err.message || 'Giriş başarısız');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
    setBearerToken('');
    setError('');
  };

  // Chat seçilince mesajları otomatik yükle
  useEffect(() => {
    if (roomId) {
      loadChatMessages();
    }
    // eslint-disable-next-line
  }, [roomId]);

  // Login sonrası ve user/token değiştiğinde sohbetleri yükle
  useEffect(() => {
    if (user && bearerToken) {
      messageApi.setToken(bearerToken);
      messageApi.fetchUserChats({
        onSuccess: (res) => setUserChats(res.data || []),
        onError: (err) => setError(err),
      });
    }
  }, [user, bearerToken]);

  // Kullanıcı login olup bir chat seçtiğinde otomatik olarak joinRoom fonksiyonunu çağır
  useEffect(() => {
    if (user && roomId && socket && !isAuthenticated) {
      joinRoom();
    }
  }, [user, roomId, socket]);

  // Sohbet listesini login olan kullanıcıya göre işleyerek karşı tarafı ve bilgileri bul
  const processedChats = userChats.map(chat => {
    let otherUserName = '';
    let otherUserId = '';
    if (userInfo) {
      if (chat.sender_id === userInfo.userId) {
        otherUserName = chat.receiver_name || chat.receiver_id;
        otherUserId = chat.receiver_id;
      } else {
        otherUserName = chat.sender_name || chat.sender_id;
        otherUserId = chat.sender_id;
      }
    }
    return {
      ...chat,
      otherUserName,
      otherUserId,
      lastMessage: chat.last_message,
      lastMessageTime: chat.last_message_time,
      unreadCount: chat.unread_count
    };
  });

  // Mesajları backend'den gelen yapıya göre işleyerek ChatRoom'a aktar
  const processedMessages = (() => {
    // Socket mesajları ve API mesajlarını ayrı ayrı işle
    const socketMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.sender_id || msg.senderId,
      senderName: msg.sender_name || msg.senderName,
      createdAt: msg.createdAt,
      originalTimestamp: msg.timestamp || msg.createdAt,
      isOwn: (msg.sender_id || msg.senderId) === userInfo?.userId,
      type: msg.type,
      status: msg.status || 'sent',
      isRead: msg.is_read || msg.isRead || false,
      source: 'socket'
    }));

    const apiMessagesProcessed = apiMessages.map(msg => {
      // Debug: Mesaj yapısını logla
      console.log('🔍 API mesajı işleniyor:', {
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        timestamp: msg.timestamp,
        createdAt: msg.createdAt,
        formatted_created_at: msg.formatted_created_at,
        sender_id: msg.sender_id,
        senderId: msg.senderId
      });

      // Tarih alanını normalize et
      let normalizedDate;
      let originalTimestamp;
      
      if (msg.formatted_created_at) {
        normalizedDate = msg.formatted_created_at;
        originalTimestamp = msg.created_at || msg.timestamp;
      } else if (msg.created_at) {
        try {
          const date = new Date(msg.created_at);
          normalizedDate = date.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          originalTimestamp = msg.created_at;
        } catch (e) {
          normalizedDate = msg.created_at;
          originalTimestamp = msg.created_at;
        }
      } else if (msg.createdAt) {
        normalizedDate = msg.createdAt;
        originalTimestamp = msg.timestamp || msg.created_at;
      } else if (msg.timestamp) {
        try {
          const date = new Date(msg.timestamp);
          normalizedDate = date.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          originalTimestamp = msg.timestamp;
        } catch (e) {
          normalizedDate = msg.timestamp;
          originalTimestamp = msg.timestamp;
        }
      } else {
        const now = new Date();
        normalizedDate = now.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        originalTimestamp = now.toISOString();
      }

      return {
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id || msg.senderId,
        senderName: msg.sender_name || msg.senderName,
        createdAt: normalizedDate,
        originalTimestamp: originalTimestamp,
        isOwn: (msg.sender_id || msg.senderId) === userInfo?.userId,
        type: msg.type,
        status: msg.status || 'sent',
        isRead: msg.is_read || msg.isRead || false,
        source: 'api'
      };
    });

    // Tüm mesajları birleştir
    const allMessages = [...socketMessages, ...apiMessagesProcessed];
    
    console.log('📊 Birleştirilmiş mesajlar:', allMessages.map(msg => ({
      id: msg.id,
      content: msg.content.substring(0, 20),
      originalTimestamp: msg.originalTimestamp,
      source: msg.source
    })));

    // Sırala
    return allMessages.sort((a, b) => {
      // Debug: Sıralama öncesi
      console.log('🔄 Sıralama karşılaştırması:', {
        a: { id: a.id, originalTimestamp: a.originalTimestamp, content: a.content.substring(0, 20), source: a.source },
        b: { id: b.id, originalTimestamp: b.originalTimestamp, content: b.content.substring(0, 20), source: b.source }
      });

      // Önce orijinal timestamp'leri karşılaştır
      if (a.originalTimestamp && b.originalTimestamp) {
        const dateA = new Date(a.originalTimestamp);
        const dateB = new Date(b.originalTimestamp);
        
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          const result = dateA.getTime() - dateB.getTime();
          console.log('📅 Timestamp sıralama sonucu:', result);
          return result;
        }
      }
      
      // Eğer timestamp yoksa veya geçersizse, ID'ye göre sırala
      const idResult = (a.id || 0) - (b.id || 0);
      console.log('🆔 ID sıralama sonucu:', idResult);
      return idResult;
    });
  })();

  // Kullanıcı listesini çek
  const loadAllUsers = async () => {
    try {
      const result = await userApi.getAllUsers();
      setAllUsers(result.data || []);
    } catch (err) {
      setError('Kullanıcılar yüklenemedi');
    }
  };

  // Yeni sohbet başlat
  const handleStartNewChat = async () => {
    if (!selectedUserId) return;
    // Önce mevcut chat var mı kontrol et
    const existingChat = userChats.find(chat =>
      (chat.sender_id === userInfo.userId && chat.receiver_id === selectedUserId) ||
      (chat.receiver_id === userInfo.userId && chat.sender_id === selectedUserId)
    );
    if (existingChat) {
      setRoomId(existingChat.id);
      setShowNewChat(false);
      setSelectedUserId('');
      return;
    }
    // Yoksa ilk mesajı göndererek yeni chat başlat
    try {
      setApiLoading(true);
      const result = await messageApi.sendMessage('Merhaba!', selectedUserId);
      // Sohbet listesini tekrar yükle
      await loadUserChats();
      // Yeni chat'i tekrar backend'den çekilen güncel userChats ile bul
      setTimeout(() => {
        const updatedChat = userChats.find(chat =>
          (chat.sender_id === userInfo.userId && chat.receiver_id === selectedUserId) ||
          (chat.receiver_id === userInfo.userId && chat.sender_id === selectedUserId)
        );
        if (updatedChat) setRoomId(updatedChat.id);
        setShowNewChat(false);
        setSelectedUserId('');
      }, 500); // Kısa bir gecikme ile state güncellensin
    } catch (err) {
      setError('Yeni sohbet başlatılamadı');
    } finally {
      setApiLoading(false);
    }
  };

  // Debug logları
  console.log('userInfo:', userInfo);
  console.log('messages:', messages);
  console.log('apiMessages:', apiMessages);
  console.log('processedMessages:', processedMessages);

  if (!user) {
    return (
      <Login
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleLogin={handleLogin}
        error={error}
      />
    );
  }

  return (
    <ChatRoom
      isAuthenticated={isAuthenticated}
      joinRoom={joinRoom}
      leaveRoom={leaveRoom}
      roomId={roomId}
      setRoomId={setRoomId}
      bearerToken={bearerToken}
      setBearerToken={setBearerToken}
      userInfo={userInfo}
      messages={processedMessages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleKeyPress={handleKeyPress}
      sendSocketMessage={sendSocketMessage}
      sendApiMessage={sendApiMessage}
      apiTestMode={apiTestMode}
      setApiTestMode={setApiTestMode}
      isConnected={isConnected}
      error={error}
      typingUsers={typingUsers}
      apiLoading={apiLoading}
      apiMessages={apiMessages}
      userChats={processedChats}
      chatParticipants={chatParticipants}
      loadUserChats={loadUserChats}
      loadChatMessages={loadChatMessages}
      loadChatParticipants={loadChatParticipants}
      receiverId={receiverId}
      setReceiverId={setReceiverId}
      testUserId={testUserId}
      setTestUserId={setTestUserId}
      sendMessageToUser={sendMessageToUser}
      showNewChat={showNewChat}
      setShowNewChat={setShowNewChat}
      allUsers={allUsers}
      loadAllUsers={loadAllUsers}
      selectedUserId={selectedUserId}
      setSelectedUserId={setSelectedUserId}
      handleStartNewChat={handleStartNewChat}
      handleTyping={handleTyping}
    />
  );
}

export default App;
