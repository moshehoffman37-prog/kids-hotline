# OneTimeOneTime Mobile App API Guide

This guide explains how to integrate audio and video playback into your mobile app.

## Authentication

All API requests require a Bearer token in the Authorization header.

### Login to get token
```
POST /api/mobile/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscriptionStatus": "active"
  }
}
```

**Token expires in 30 days.** Use `/api/mobile/refresh-token` to get a new one before expiry.

---

## Audio Files (Media Library)

Audio files uploaded through the admin "Media Library" are stored in the `videos` table with `mediaType: "audio"`.

### Step 1: Get list of audio content

```
GET /api/videos
Authorization: Bearer <token>
```

**Response includes audio files:**
```json
[
  {
    "id": "abc123-uuid",
    "title": "Story Time Episode 1",
    "description": "A fun story for kids",
    "mediaType": "audio",
    "status": "ready",
    "duration": 180,
    "categoryId": "category-uuid",
    "thumbnailPath": "/objects/.private/thumbnails/abc123.jpg",
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

### Step 2: Stream the audio

```
GET /api/audio/{id}/stream
Authorization: Bearer <token>
```

**Example:**
```
GET /api/audio/abc123-uuid/stream
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Headers:**
- `Content-Type: audio/mpeg` (for MP3 files)
- `Accept-Ranges: bytes` (supports seeking)
- `Content-Length: 5242880` (file size in bytes)

**The server streams the raw audio data directly.** Use your platform's audio player to play this URL.

### Seeking/Range Requests

The audio endpoint supports HTTP Range requests for seeking:

```
GET /api/audio/{id}/stream
Authorization: Bearer <token>
Range: bytes=1000000-2000000
```

**Response:** HTTP 206 Partial Content with the requested byte range.

---

## Video Files (Vimeo)

Videos are hosted on Vimeo and use embedded iframe players.

### Get video list

```
GET /api/videos
Authorization: Bearer <token>
```

**Video response:**
```json
{
  "id": "video-uuid",
  "title": "Educational Video",
  "mediaType": "video",
  "storageType": "vimeo",
  "vimeoVideoId": "123456789",
  "vimeoEmbedUrl": "https://player.vimeo.com/video/123456789?h=abc123hash&dnt=1",
  "thumbnailPath": "https://i.vimeocdn.com/video/123456789.jpg",
  "duration": 300,
  "status": "ready"
}
```

### Playing Vimeo videos

Use the `vimeoEmbedUrl` in a WebView or Vimeo SDK:

**iOS (using WKWebView):**
```swift
let embedUrl = video.vimeoEmbedUrl
let webView = WKWebView()
webView.load(URLRequest(url: URL(string: embedUrl)!))
```

**Android (using WebView):**
```kotlin
val embedUrl = video.vimeoEmbedUrl
webView.loadUrl(embedUrl)
```

**React Native:**
```jsx
<WebView source={{ uri: video.vimeoEmbedUrl }} />
```

---

## Album Tracks

Albums contain multiple audio tracks organized together.

### Get albums list

```
GET /api/albums
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "album-uuid",
    "title": "Bedtime Stories Collection",
    "description": "Relaxing stories for bedtime",
    "trackCount": 5,
    "status": "published"
  }
]
```

### Get album with tracks

```
GET /api/albums/{albumId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "album-uuid",
  "title": "Bedtime Stories Collection",
  "tracks": [
    {
      "id": "track-uuid-1",
      "title": "The Sleepy Bear",
      "trackNumber": 1,
      "duration": 300
    },
    {
      "id": "track-uuid-2",
      "title": "Counting Stars",
      "trackNumber": 2,
      "duration": 240
    }
  ]
}
```

### Stream album track

```
GET /api/albums/{albumId}/tracks/{trackId}/stream
Authorization: Bearer <token>
```

---

## Video Categories (with Subcategories)

```
GET /api/video-categories
```

**Response:**
```json
[
  { "id": "cat-1", "name": "Stories", "parentCategoryId": null },
  { "id": "cat-2", "name": "Short Stories", "parentCategoryId": "cat-1" },
  { "id": "cat-3", "name": "Long Stories", "parentCategoryId": "cat-1" },
  { "id": "cat-4", "name": "Music", "parentCategoryId": null }
]
```

**Display logic:**
1. Show categories where `parentCategoryId` is `null` (main categories)
2. When user expands a category, show items where `parentCategoryId` matches that category's `id`

---

## Thumbnails

### Audio/Video Thumbnails
```
GET /api/videos/{id}/thumbnail
```
Returns the image (no auth required if video exists).

### Album Thumbnails
```
GET /api/albums/{id}/thumbnail
```

---

## Code Examples

### iOS Swift - Playing Audio
```swift
import AVFoundation

class AudioPlayer {
    var player: AVPlayer?
    let token: String
    
    init(token: String) {
        self.token = token
        // Enable background playback
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
        try? AVAudioSession.sharedInstance().setActive(true)
    }
    
    func play(audioId: String) {
        guard let url = URL(string: "https://yourapp.replit.app/api/audio/\(audioId)/stream") else { return }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        // Create asset with headers
        let headers = ["Authorization": "Bearer \(token)"]
        let asset = AVURLAsset(url: url, options: ["AVURLAssetHTTPHeaderFieldsKey": headers])
        let playerItem = AVPlayerItem(asset: asset)
        
        player = AVPlayer(playerItem: playerItem)
        player?.play()
    }
}
```

### Android Kotlin - Playing Audio
```kotlin
import android.media.MediaPlayer
import java.net.URL

class AudioPlayer(private val token: String) {
    private var mediaPlayer: MediaPlayer? = null
    
    fun play(audioId: String) {
        val url = "https://yourapp.replit.app/api/audio/$audioId/stream"
        
        mediaPlayer = MediaPlayer().apply {
            setDataSource(url, mapOf("Authorization" to "Bearer $token"))
            prepareAsync()
            setOnPreparedListener { start() }
        }
    }
    
    fun stop() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}
```

### React Native - Playing Audio
```jsx
import { Audio } from 'expo-av';

async function playAudio(audioId, token) {
  const sound = new Audio.Sound();
  
  await sound.loadAsync({
    uri: `https://yourapp.replit.app/api/audio/${audioId}/stream`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  await sound.playAsync();
  return sound;
}
```

---

## Background Playback Requirements

Your app MUST support background audio playback:

### iOS
1. Enable "Background Modes" in Xcode
2. Check "Audio, AirPlay, and Picture in Picture"
3. Use `AVAudioSession.Category.playback`

### Android
1. Use a Foreground Service for audio playback
2. Implement MediaSession for lock screen controls
3. Add to AndroidManifest.xml:
   ```xml
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
   ```

---

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| 401 | Token expired or invalid - call `/api/mobile/refresh-token` |
| 403 | Subscription not active |
| 404 | Content not found |
| 500 | Server error |

---

## Quick Reference

| Content Type | List Endpoint | Stream Endpoint |
|--------------|---------------|-----------------|
| Audio (Media) | `GET /api/videos` (filter by mediaType: "audio") | `GET /api/audio/{id}/stream` |
| Video | `GET /api/videos` (filter by mediaType: "video") | Use `vimeoEmbedUrl` in WebView |
| Album Tracks | `GET /api/albums/{id}` | `GET /api/albums/{albumId}/tracks/{trackId}/stream` |

All streaming endpoints require `Authorization: Bearer <token>` header.
