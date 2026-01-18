import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://onetimeonetime.com";
const AUTH_TOKEN_KEY = "@onetimeonetime_auth_token";
const USER_DATA_KEY = "@onetimeonetime_user_data";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  embedUrl: string;
  duration?: number;
  createdAt?: string;
  category?: string;
}

export interface AudioItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt?: string;
  category?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  pageCount?: number;
  createdAt?: string;
  category?: string;
}

export type ContentType = "video" | "audio" | "document";

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  thumbnailUrl?: string;
  embedUrl?: string;
  duration?: number;
  pageCount?: number;
  category?: string;
  createdAt?: string;
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await clearAuth();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const data = await makeRequest<{ token: string; user: User }>(
    "/api/mobile/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );

  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
    AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user)),
  ]);

  return data;
}

export async function getStoredAuth(): Promise<{
  token: string | null;
  user: User | null;
}> {
  try {
    const [token, userData] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(USER_DATA_KEY),
    ]);
    return {
      token,
      user: userData ? JSON.parse(userData) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(USER_DATA_KEY),
  ]);
}

export async function refreshToken(): Promise<{ token: string }> {
  const data = await makeRequest<{ token: string }>("/api/mobile/refresh-token", {
    method: "POST",
  });
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
  return data;
}

export async function getUserInfo(): Promise<User> {
  return makeRequest<User>("/api/mobile/me");
}

export async function getVideos(): Promise<VideoItem[]> {
  return makeRequest<VideoItem[]>("/api/videos");
}

export async function getAudioFiles(): Promise<AudioItem[]> {
  return makeRequest<AudioItem[]>("/api/audio-files");
}

export async function getDocuments(): Promise<DocumentItem[]> {
  return makeRequest<DocumentItem[]>("/api/documents");
}

export function getAudioStreamUrl(audioId: string): string {
  return `${API_BASE_URL}/api/audio-files/${audioId}/stream`;
}

export function getDocumentPagesUrl(documentId: string): string {
  return `${API_BASE_URL}/api/documents/${documentId}/pages`;
}

export async function getAllContent(): Promise<ContentItem[]> {
  const [videos, audioFiles, documents] = await Promise.all([
    getVideos().catch(() => []),
    getAudioFiles().catch(() => []),
    getDocuments().catch(() => []),
  ]);

  const content: ContentItem[] = [
    ...videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      type: "video" as ContentType,
      thumbnailUrl: v.thumbnailUrl,
      embedUrl: v.embedUrl,
      duration: v.duration,
      category: v.category || "Videos",
      createdAt: v.createdAt,
    })),
    ...audioFiles.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: "audio" as ContentType,
      thumbnailUrl: a.thumbnailUrl,
      duration: a.duration,
      category: a.category || "Audio",
      createdAt: a.createdAt,
    })),
    ...documents.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      type: "document" as ContentType,
      thumbnailUrl: d.thumbnailUrl,
      pageCount: d.pageCount,
      category: d.category || "Documents",
      createdAt: d.createdAt,
    })),
  ];

  content.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return content;
}

export function getCategories(content: ContentItem[]): string[] {
  const categories = new Set<string>();
  content.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
    }
  });
  return Array.from(categories);
}
