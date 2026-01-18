import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://onetimeonetime.com";
const AUTH_TOKEN_KEY = "@onetimeonetime_auth_token";
const USER_DATA_KEY = "@onetimeonetime_user_data";
const VIEWED_CONTENT_KEY = "@onetimeonetime_viewed_content";
const SUBSCRIPTION_KEY = "@onetimeonetime_subscription";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface SubscriptionStatus {
  subscriptionStatus: string;
  active: boolean;
  isWhitelisted?: boolean;
  trialDaysRemaining?: number | null;
}

export interface VideoCategory {
  id: string;
  name: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  mediaType?: "video" | "audio";
  storageType?: "local" | "bunny_storage" | "bunny";
  thumbnailPath?: string | null;
  bunnyThumbnailUrl?: string | null;
  bunnyStorageUrl?: string | null;
  bunnyGuid?: string | null;
  categoryId?: string | null;
  status?: string;
  duration?: number | null;
  createdAt?: string;
  viewed?: boolean;
}

export interface StreamResponse {
  bunny?: boolean;
  bunnyStorage?: boolean;
  embedUrl?: string;
  cdnUrl?: string;
  mediaType?: "video" | "audio";
}

export interface VideoViewStatus {
  viewed: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  pageCount?: number;
  allowDownload?: boolean;
  createdAt?: string;
}

export interface AlbumTrack {
  id: string;
  title: string;
  trackNumber: number;
  duration?: number | null;
}

export interface AlbumItem {
  id: string;
  title: string;
  description?: string | null;
  trackCount?: number;
  tracks?: AlbumTrack[];
  createdAt?: string;
}

export type ContentType = "video" | "audio" | "document" | "album";

export interface ContentItem {
  id: string;
  title: string;
  description?: string | null;
  type: ContentType;
  thumbnailUrl?: string | null;
  thumbnailRequiresAuth?: boolean;
  embedUrl?: string | null;
  duration?: number | null;
  pageCount?: number;
  trackCount?: number;
  category?: string;
  categoryId?: string | null;
  createdAt?: string;
  isNew?: boolean;
}

export interface CategorySection {
  id: string;
  name: string;
  type: ContentType;
  items: ContentItem[];
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
    throw new Error("Couldn't find account info. Double check credentials. You can reset your password at onetimeonetime.com/login");
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
    AsyncStorage.removeItem(SUBSCRIPTION_KEY),
  ]);
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const data = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    return null;
  }
  return null;
}

export async function checkSubscription(): Promise<SubscriptionStatus> {
  try {
    const response = await makeRequest<SubscriptionStatus>("/api/mobile/subscription");
    console.log("[Subscription] API response:", JSON.stringify(response));
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(response));
    return response;
  } catch (error) {
    console.log("[Subscription] API error:", error);
    return {
      subscriptionStatus: "unknown",
      active: true,
      isWhitelisted: false,
    };
  }
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

export async function getVideoCategories(): Promise<VideoCategory[]> {
  return makeRequest<VideoCategory[]>("/api/video-categories");
}

export async function getVideos(): Promise<VideoItem[]> {
  return makeRequest<VideoItem[]>("/api/videos");
}


export async function getDocuments(): Promise<DocumentItem[]> {
  return makeRequest<DocumentItem[]>("/api/documents");
}

export async function getAlbums(): Promise<AlbumItem[]> {
  return makeRequest<AlbumItem[]>("/api/albums");
}

export async function getAlbumById(albumId: string): Promise<AlbumItem> {
  return makeRequest<AlbumItem>(`/api/albums/${albumId}`);
}

export function getAlbumThumbnailUrl(albumId: string): { url: string; requiresAuth: boolean } {
  return {
    url: `${API_BASE_URL}/api/albums/${albumId}/thumbnail`,
    requiresAuth: true,
  };
}

export function getAlbumTrackStreamUrl(albumId: string, trackId: string): string {
  return `${API_BASE_URL}/api/albums/${albumId}/tracks/${trackId}/stream`;
}

export function getVideoThumbnailUrl(video: VideoItem): { url: string | null; requiresAuth: boolean } {
  if (video.thumbnailPath) {
    return {
      url: `${API_BASE_URL}/api/videos/${video.id}/thumbnail`,
      requiresAuth: true,
    };
  }
  if (video.bunnyThumbnailUrl) {
    return {
      url: video.bunnyThumbnailUrl,
      requiresAuth: false,
    };
  }
  if (video.bunnyGuid) {
    return {
      url: `https://vz-b4f3c875-a3e.b-cdn.net/${video.bunnyGuid}/thumbnail.jpg`,
      requiresAuth: false,
    };
  }
  return { url: null, requiresAuth: false };
}

export async function getStreamUrl(itemId: string): Promise<StreamResponse> {
  return makeRequest<StreamResponse>(`/api/videos/${itemId}/stream`);
}

async function getLocalViewedContent(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(VIEWED_CONTENT_KEY);
    if (data) {
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    console.log("Error reading viewed content:", error);
  }
  return new Set();
}

async function setLocalViewedContent(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(VIEWED_CONTENT_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.log("Error saving viewed content:", error);
  }
}

export async function markVideoViewed(videoId: string): Promise<void> {
  const viewedIds = await getLocalViewedContent();
  viewedIds.add(videoId);
  await setLocalViewedContent(viewedIds);

  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}/mark-viewed`, {
      method: "POST",
      headers,
    });
    
    if (!response.ok && response.status !== 204) {
      console.log("Mark viewed response:", response.status);
    }
  } catch (error) {
    console.log("Mark viewed error:", error);
  }
}

export async function isContentViewedLocally(contentId: string): Promise<boolean> {
  const viewedIds = await getLocalViewedContent();
  return viewedIds.has(contentId);
}

export function isVideoNew(video: VideoItem, locallyViewed: boolean = false): boolean {
  if (!video.createdAt) return false;
  if (locallyViewed || video.viewed) return false;
  const createdTime = new Date(video.createdAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return (now - createdTime) < twentyFourHours;
}

export function getDocumentPageUrl(documentId: string, pageNumber: number): string {
  return `${API_BASE_URL}/api/documents/${documentId}/page/${pageNumber}`;
}

function formatCategoryName(category: string): string {
  return category
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function getContentByCategories(): Promise<CategorySection[]> {
  const [videoCategories, allContent, albums, documents, locallyViewed] = await Promise.all([
    getVideoCategories().catch(() => [] as VideoCategory[]),
    getVideos().catch(() => [] as VideoItem[]),
    getAlbums().catch(() => [] as AlbumItem[]),
    getDocuments().catch(() => [] as DocumentItem[]),
    getLocalViewedContent(),
  ]);

  const sections: CategorySection[] = [];
  const categoryMap = new Map(videoCategories.map((c) => [c.id, c.name]));
  
  const contentByCategory = new Map<string, VideoItem[]>();
  allContent.forEach((item) => {
    const catId = item.categoryId || "uncategorized";
    if (!contentByCategory.has(catId)) {
      contentByCategory.set(catId, []);
    }
    contentByCategory.get(catId)!.push(item);
  });

  contentByCategory.forEach((categoryItems, categoryId) => {
    const categoryName = categoryMap.get(categoryId) || formatCategoryName(categoryId);
    sections.push({
      id: `content-${categoryId}`,
      name: categoryName,
      type: "video",
      items: categoryItems.map((item) => {
        const isAudio = item.mediaType === "audio";
        const thumb = getVideoThumbnailUrl(item);
        const viewedLocally = locallyViewed.has(item.id);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          type: isAudio ? "audio" as ContentType : "video" as ContentType,
          thumbnailUrl: thumb.url,
          thumbnailRequiresAuth: thumb.requiresAuth,
          duration: item.duration,
          categoryId: item.categoryId,
          createdAt: item.createdAt,
          isNew: isVideoNew(item, viewedLocally),
        };
      }),
    });
  });

  if (albums.length > 0) {
    sections.push({
      id: "albums",
      name: "Albums",
      type: "album",
      items: albums.map((album) => {
        const thumb = getAlbumThumbnailUrl(album.id);
        return {
          id: album.id,
          title: album.title,
          description: album.description,
          type: "album" as ContentType,
          thumbnailUrl: thumb.url,
          thumbnailRequiresAuth: thumb.requiresAuth,
          trackCount: album.trackCount,
          createdAt: album.createdAt,
        };
      }),
    });
  }

  if (documents.length > 0) {
    sections.push({
      id: "documents",
      name: "Documents",
      type: "document",
      items: documents.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        type: "document" as ContentType,
        pageCount: d.pageCount,
        createdAt: d.createdAt,
      })),
    });
  }

  return sections;
}
