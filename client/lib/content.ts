import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@onetimeonetime_favorites";
const HISTORY_KEY = "@onetimeonetime_history";

export type ContentType = "video" | "audio" | "photo";

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  thumbnailUrl: string;
  mediaUrl: string;
  duration?: number;
  category: string;
  createdAt: string;
}

export interface HistoryItem extends ContentItem {
  watchedAt: string;
  progress?: number;
}

export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(contentId: string): Promise<void> {
  const favorites = await getFavorites();
  if (!favorites.includes(contentId)) {
    favorites.push(contentId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export async function removeFavorite(contentId: string): Promise<void> {
  const favorites = await getFavorites();
  const updated = favorites.filter((id) => id !== contentId);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export async function isFavorite(contentId: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.includes(contentId);
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(item: ContentItem, progress?: number): Promise<void> {
  const history = await getHistory();
  const existingIndex = history.findIndex((h) => h.id === item.id);
  
  const historyItem: HistoryItem = {
    ...item,
    watchedAt: new Date().toISOString(),
    progress,
  };

  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }
  
  history.unshift(historyItem);
  
  const trimmed = history.slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(FAVORITES_KEY),
    AsyncStorage.removeItem(HISTORY_KEY),
  ]);
}
