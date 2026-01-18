import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

interface User {
  id: string;
  email: string;
  name: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: "video" | "audio" | "photo";
  thumbnailUrl: string;
  mediaUrl: string;
  duration?: number;
  category: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "demo@onetimeonetime.com": {
    password: "demo123",
    user: {
      id: "1",
      email: "demo@onetimeonetime.com",
      name: "Demo User",
    },
  },
};

const CATEGORIES: Category[] = [
  { id: "stories", name: "Stories" },
  { id: "mishnayos", name: "Mishnayos" },
  { id: "one-daf-one-daf", name: "One Daf One Daf" },
  { id: "just-kidding-podcast", name: "Just Kidding Podcast" },
  { id: "documents", name: "Documents", icon: "file-text" },
];

const SAMPLE_CONTENT: ContentItem[] = [
  {
    id: "1",
    title: "Shabbos perek 21",
    description: "Mishnayos Shabbos Perek 21 with clear explanation",
    type: "video",
    thumbnailUrl: "https://picsum.photos/seed/vid1/400/300",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: 855,
    category: "mishnayos",
    createdAt: "2026-01-17T10:00:00Z",
  },
  {
    id: "2",
    title: "Shabbos perek 20",
    description: "Mishnayos Shabbos Perek 20 with clear explanation",
    type: "video",
    thumbnailUrl: "https://picsum.photos/seed/vid2/400/300",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: 1175,
    category: "mishnayos",
    createdAt: "2026-01-16T10:00:00Z",
  },
  {
    id: "3",
    title: "20260112_112828",
    description: "Latest story recording",
    type: "video",
    thumbnailUrl: "https://picsum.photos/seed/vid3/400/300",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 1809,
    category: "stories",
    createdAt: "2026-01-12T11:28:28Z",
  },
  {
    id: "4",
    title: "1st story export 1",
    description: "First story export",
    type: "video",
    thumbnailUrl: "https://picsum.photos/seed/vid4/400/300",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: 296,
    category: "stories",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "5",
    title: "Just Kidding Episode 15",
    description: "The latest episode of Just Kidding Podcast",
    type: "audio",
    thumbnailUrl: "https://picsum.photos/seed/aud1/400/400",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 372,
    category: "just-kidding-podcast",
    createdAt: "2026-01-15T14:00:00Z",
  },
  {
    id: "6",
    title: "Just Kidding Episode 14",
    description: "Another great episode of Just Kidding Podcast",
    type: "audio",
    thumbnailUrl: "https://picsum.photos/seed/aud2/400/400",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 418,
    category: "just-kidding-podcast",
    createdAt: "2026-01-08T14:00:00Z",
  },
  {
    id: "7",
    title: "One Daf One Daf - Berachos 5",
    description: "Daf Yomi shiur on Berachos",
    type: "video",
    thumbnailUrl: "https://picsum.photos/seed/vid5/400/300",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    duration: 1245,
    category: "one-daf-one-daf",
    createdAt: "2026-01-14T08:00:00Z",
  },
  {
    id: "8",
    title: "Weekly Newsletter",
    description: "This week's newsletter with updates and announcements",
    type: "photo",
    thumbnailUrl: "https://picsum.photos/seed/doc1/400/600",
    mediaUrl: "https://picsum.photos/seed/doc1/800/1200",
    category: "documents",
    createdAt: "2026-01-13T12:00:00Z",
  },
  {
    id: "9",
    title: "Schedule Update",
    description: "Updated schedule for the coming month",
    type: "photo",
    thumbnailUrl: "https://picsum.photos/seed/doc2/400/600",
    mediaUrl: "https://picsum.photos/seed/doc2/800/1200",
    category: "documents",
    createdAt: "2026-01-11T12:00:00Z",
  },
];

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const userRecord = DEMO_USERS[email.toLowerCase()];

    if (!userRecord || userRecord.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

    return res.json({
      token,
      user: userRecord.user,
    });
  });

  app.get("/api/content/home", (_req: Request, res: Response) => {
    const sortedContent = [...SAMPLE_CONTENT].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const recent = sortedContent.slice(0, 4);

    return res.json({
      recent,
      categories: CATEGORIES,
      allContent: sortedContent,
    });
  });

  app.get("/api/content/sections", (_req: Request, res: Response) => {
    const sections = CATEGORIES.map((category) => ({
      id: category.id,
      title: category.name,
      items: SAMPLE_CONTENT.filter((item) => item.category === category.id),
    })).filter((section) => section.items.length > 0);

    return res.json(sections);
  });

  app.get("/api/content/favorites", (_req: Request, res: Response) => {
    return res.json([]);
  });

  app.get("/api/content/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const item = SAMPLE_CONTENT.find((c) => c.id === id);

    if (!item) {
      return res.status(404).json({ message: "Content not found" });
    }

    return res.json(item);
  });

  const httpServer = createServer(app);

  return httpServer;
}
