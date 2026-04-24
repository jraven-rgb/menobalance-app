import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/constants/colors';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function CommunityScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposing, setIsComposing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  
  const categories = ['All', 'Mental Health', 'Physical Symptoms', 'General Advice', 'Luteal Phase specifically'];

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/community/posts${activeCategory !== 'All' ? `?category=${activeCategory}` : ''}`);
      setPosts(response.data);
    } catch (e) {
      // Setup mock data if backend not connected yet
      setPosts([
        { id: '1', author_alias: 'Anonymous', category: 'Physical Symptoms', content: 'Has anyone else experienced intense joint pain only on the right side during perimenopause?', likes: 12, comments_count: 3, created_at: new Date().toISOString() },
        { id: '2', author_alias: 'Anonymous', category: 'Mental Health', content: 'The brain fog today is completely overwhelming. I forgot my own password to my computer.', likes: 45, comments_count: 14, created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitPost = async () => {
    if (!newPostContent.trim()) return;
    try {
      await api.post('/community/posts', {
        category: activeCategory === 'All' ? 'General Advice' : activeCategory,
        title: 'Community Post',
        content: newPostContent
      });
      setNewPostContent('');
      setIsComposing(false);
      fetchPosts();
      Alert.alert("Success", "Your anonymous post has been shared.");
    } catch (e) {
      Alert.alert("Oops", "Couldn't send post right now.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Support</Text>
        <Text style={styles.subtitle}>You are safe. You are anonymous.</Text>
      </View>

      <View style={styles.categoriesWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catBadge, activeCategory === cat && styles.catBadgeActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isComposing ? (
        <View style={styles.composeBox}>
          <TextInput 
            style={styles.composeInput}
            multiline
            placeholder="Share what you are going through safely and anonymously..."
            value={newPostContent}
            onChangeText={setNewPostContent}
          />
          <View style={styles.composeActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsComposing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submitPost}>
              <Text style={styles.submitText}>Post Anonymously</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 40}} />
          ) : (
            posts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}><Text>👤</Text></View>
                  <View>
                    <Text style={styles.author}>{post.author_alias}</Text>
                    <Text style={styles.postCat}>{post.category}</Text>
                  </View>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                <View style={styles.postFooter}>
                  <TouchableOpacity style={styles.interactionBtn}>
                    <Ionicons name="heart-outline" size={20} color={Colors.textLight} />
                    <Text style={styles.interactionText}>{post.likes} Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.interactionBtn}>
                    <Ionicons name="chatbubble-outline" size={20} color={Colors.textLight} />
                    <Text style={styles.interactionText}>{post.comments_count} Replies</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {!isComposing && (
        <TouchableOpacity style={styles.fab} onPress={() => setIsComposing(true)}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: '#EC407A', fontWeight: '600', marginTop: 4 },
  
  categoriesWrap: { paddingHorizontal: 24, marginBottom: 16 },
  catBadge: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.inputBg, borderRadius: 20, marginRight: 8 },
  catBadgeActive: { backgroundColor: Colors.primary },
  catText: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  catTextActive: { color: Colors.white },

  feed: { flex: 1 },
  feedContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  postCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  author: { fontSize: 15, fontWeight: '700', color: Colors.text },
  postCat: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  postContent: { fontSize: 15, color: Colors.text, lineHeight: 22, marginBottom: 16 },
  
  postFooter: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: Colors.inputBg, paddingTop: 12 },
  interactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interactionText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },

  fab: { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#EC407A', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 } },
  
  composeBox: { flex: 1, padding: 24 },
  composeInput: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 20, paddingTop: 20, fontSize: 16, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top' },
  composeActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: Colors.inputBg, alignItems: 'center' },
  cancelText: { color: Colors.textLight, fontWeight: '700' },
  submitBtn: { flex: 2, padding: 16, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center' },
  submitText: { color: Colors.white, fontWeight: '700' }
});
