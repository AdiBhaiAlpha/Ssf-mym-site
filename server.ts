import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getInitialDBState, AppDatabase } from './src/server/db-initial';
import { renderPhotoCardServerSide } from './src/server/card-renderer';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Config for Multer Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error("Failed to create upload directory", err);
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Sanitization function for folder name
const sanitizeFolderName = (name: string) => {
  if (!name) return 'default_user';
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim().substring(0, 35) || 'default_user';
};

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userNameParam = req.query.userName as string || req.body.userName as string || 'default_user';
    const folderName = sanitizeFolderName(userNameParam);
    const userDir = path.join(process.cwd(), 'public', 'uploads', 'profiles', folderName);
    
    if (!fs.existsSync(userDir)) {
      try {
        fs.mkdirSync(userDir, { recursive: true });
      } catch (err) {
        console.error("Failed to create profile dir", err);
      }
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'photo-' + uniqueSuffix + ext);
  }
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for profile picture
});

// Initialize local JSON Database if it doesn't exist
function loadDatabase(): AppDatabase {
  const initialState = getInitialDBState();
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const db = JSON.parse(data) as AppDatabase;
      
      // Auto-migrate settings
      db.settings = { ...initialState.settings, ...db.settings };
      
      // If the council news is missing, let's insert it
      if (db.news && !db.news.some(n => n.id === 'news_council25')) {
        db.news.unshift(initialState.news[0]);
      }

      // Populate default books if empty
      if (!db.books || db.books.length === 0) {
        db.books = initialState.books;
      }

      // Populate default circulars if empty
      if (!db.circulars || db.circulars.length === 0) {
        db.circulars = initialState.circulars;
      }

      // Populate default memberLogins if missing
      if (!db.memberLogins) {
        db.memberLogins = initialState.memberLogins || [];
      }

      // Populate default visits if empty
      if (!db.visits || db.visits.length === 0) {
        db.visits = [];
        const pages = ['Home', 'News', 'Publications', 'Memberships', 'Circulars', 'About'];
        const devices: ('mobile' | 'desktop' | 'tablet')[] = ['desktop', 'mobile', 'tablet'];
        
        // Generate daily data for past 15 days
        for (let i = 0; i < 15; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateString = d.toISOString().split('T')[0];
          
          pages.forEach(p => {
            devices.forEach(dev => {
              const baseViews = dev === 'desktop' ? 12 : dev === 'mobile' ? 8 : 2;
              const viewsCount = Math.floor(baseViews + Math.random() * 8);
              db.visits.push({
                id: `v_seed_${dateString}_${p}_${dev}`,
                date: dateString,
                page: p,
                views: viewsCount,
                device: dev
              });
            });
          });
        }
        
        // Ensure some months have data for monthly trends (e.g. Jan, Feb, Mar, Apr, May 2026)
        // We will generate 5 past months records
        const months = ['01', '02', '03', '04', '05'];
        months.forEach(month => {
          const dateStr = `2026-${month}-15`;
          pages.forEach(p => {
            devices.forEach(dev => {
              const baseViews = dev === 'desktop' ? 180 : dev === 'mobile' ? 120 : 35;
              const viewsCount = Math.floor(baseViews + Math.random() * 80);
              db.visits.push({
                id: `v_seed_m_${dateStr}_${p}_${dev}`,
                date: dateStr,
                page: p,
                views: viewsCount,
                device: dev
              });
            });
          });
        });
      }
      
      return db;
    }
  } catch (error) {
    console.error('Error loading db.json, migrating or resetting database...', error);
  }
  
  saveDatabase(initialState);
  return initialState;
}

function saveDatabase(db: AppDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to db.json', error);
  }
}

// Check SuperAdmin access by email
function isSuperAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  if (lowerEmail === 'chitronbhattacharjee@gmail.com') return true;
  
  try {
    const db = loadDatabase();
    const matchedInvite = (db.invitations || []).find(
      i => i.email.toLowerCase() === lowerEmail && i.status === 'accepted'
    );
    if (matchedInvite) {
      return true;
    }
  } catch (e) {
    console.error('Failed to read dynamic credentials', e);
  }
  return false;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve uploads folder statically
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // File upload route (supports PDF, Image, video, audio, gif etc.)
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ url: publicUrl, originalName: req.file.originalname, size: req.file.size });
  });

  // Server-side Photo Card rendering endpoint
  app.post('/api/render-card', async (req, res) => {
    try {
      const { item, settings } = req.body;
      if (!item) {
        return res.status(400).json({ error: 'Article item data is required' });
      }
      if (!settings) {
        return res.status(400).json({ error: 'Rendering settings are required' });
      }

      const requestHost = req.get('host') || 'localhost:3000';

      const result = await renderPhotoCardServerSide({
        item,
        settings,
        requestHost,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Server-side rendering failure:', err);
      res.status(500).json({
        error: 'গ্রুপ কার্ড রেন্ডারিং ব্যর্থ হয়েছে (Server rendering failed)',
        details: err.message,
        stack: err.stack,
      });
    }
  });

  // Profile picture upload (stores in individual folder name-wise)
  app.post('/api/upload-profile-photo', uploadProfile.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const userNameParam = req.query.userName as string || req.body.userName as string || 'default_user';
    const folderName = sanitizeFolderName(userNameParam);
    const publicUrl = `/uploads/profiles/${folderName}/${req.file.filename}`;
    res.json({ url: publicUrl, originalName: req.file.originalname, size: req.file.size });
  });

  // Profile picture upload from URL
  app.post('/api/upload-profile-photo-url', async (req, res) => {
    const { imageUrl, userName } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'কোনো ছবির লিংক পাওয়া যায়নি।' });
    }
    try {
      const userNameParam = userName || 'default_user';
      const folderName = sanitizeFolderName(userNameParam);
      const userDir = path.join(process.cwd(), 'public', 'uploads', 'profiles', folderName);
      
      if (!fs.existsSync(userDir)) {
        try {
          fs.mkdirSync(userDir, { recursive: true });
        } catch (dirErr) {
          console.error("Failed to make user dynamic dir", dirErr);
        }
      }

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (!response.ok) {
        return res.status(400).json({ error: 'প্রদত্ত লিংক থেকে ছবি ডাউনলোড করা যায়নি।' });
      }

      const contentType = response.headers.get('content-type') || '';
      let ext = '.jpg';
      if (contentType.includes('image/png')) ext = '.png';
      else if (contentType.includes('image/webp')) ext = '.webp';
      else if (contentType.includes('image/gif')) ext = '.gif';
      else if (contentType.includes('image/jpeg')) ext = '.jpg';

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `photo-link-${uniqueSuffix}${ext}`;
      
      fs.writeFileSync(path.join(userDir, filename), buffer);

      const publicUrl = `/uploads/profiles/${folderName}/${filename}`;
      res.json({ url: publicUrl });
    } catch (err: any) {
      console.error('Failed to download image URL', err);
      res.status(500).json({ error: 'ছবি ডাউনলোড করতে অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে: ' + err.message });
    }
  });

  // Image proxy to bypass CORS restrictions on html2canvas
  app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('URL is required');
    }
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (!response.ok) {
        return res.status(400).send('Failed to fetch image');
      }
      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (err: any) {
      console.error('Image proxy error:', err);
      res.status(500).send('Error proxying image');
    }
  });

  // API Route - Get Entire DB
  app.get('/api/db', (req, res) => {
    const db = loadDatabase();
    res.json(db);
  });

  // Dynamic robots.txt with both sitemap and sitemap-index declarations
  app.get('/robots.txt', (req, res) => {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

Sitemap: ${proto}://${host}/sitemap-index.xml
Sitemap: ${proto}://${host}/sitemap.xml`);
  });

  // Helper types and functions for sitemap architecture
  interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: string;
  }

  function getAllSitemapUrls(baseUrl: string, db: AppDatabase): SitemapUrl[] {
    const urls: SitemapUrl[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Static and Tab routes (clean paths & backward compatible queries)
    const tabs = ['home', 'news', 'books', 'events', 'circulars', 'about', 'join', 'portal', 'media', 'contact'];
    const tabNamesMap: Record<string, string> = {
      home: '/',
      about: '/about',
      contact: '/contact',
      join: '/join',
      news: '/news',
      books: '/books',
      events: '/events',
      circulars: '/circulars',
      media: '/media',
      portal: '/portal'
    };

    Object.entries(tabNamesMap).forEach(([tab, path]) => {
      // Clean path
      urls.push({
        loc: `${baseUrl}${path}`,
        changefreq: 'daily',
        priority: tab === 'home' ? '1.0' : '0.8',
        lastmod: today
      });
      // Query path for full backwards compatibility
      urls.push({
        loc: `${baseUrl}/?tab=${tab}`,
        changefreq: 'daily',
        priority: tab === 'home' ? '0.9' : '0.7',
        lastmod: today
      });
    });

    // Extra required SEO static routes
    const extraStatic = ['/privacy-policy', '/terms', '/blog'];
    extraStatic.forEach(p => {
      urls.push({
        loc: `${baseUrl}${p}`,
        changefreq: 'monthly',
        priority: '0.5',
        lastmod: today
      });
    });

    // 2. News Articles (clean paths and query URLs)
    if (db.news && Array.isArray(db.news)) {
      db.news.forEach(item => {
        const dateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : today;
        urls.push({
          loc: `${baseUrl}/news/${item.id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: dateStr
        });
        urls.push({
          loc: `${baseUrl}/post/${item.id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: dateStr
        });
        urls.push({
          loc: `${baseUrl}/?tab=news&amp;newsId=${item.id}`,
          changefreq: 'weekly',
          priority: '0.6',
          lastmod: dateStr
        });
      });
    }

    // 3. Blog Posts (clean paths and query URLs)
    if (db.blogs && Array.isArray(db.blogs)) {
      db.blogs.forEach(item => {
        const dateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : today;
        urls.push({
          loc: `${baseUrl}/blog/${item.id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: dateStr
        });
        urls.push({
          loc: `${baseUrl}/post/${item.id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: dateStr
        });
        urls.push({
          loc: `${baseUrl}/?tab=news&amp;blogId=${item.id}`,
          changefreq: 'weekly',
          priority: '0.6',
          lastmod: dateStr
        });
      });
    }

    // 4. Events (clean paths and query URLs)
    if (db.events && Array.isArray(db.events)) {
      db.events.forEach(item => {
        const dateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : today;
        urls.push({
          loc: `${baseUrl}/event/${item.id}`,
          changefreq: 'weekly',
          priority: '0.6',
          lastmod: dateStr
        });
        urls.push({
          loc: `${baseUrl}/?tab=events&amp;eventId=${item.id}`,
          changefreq: 'weekly',
          priority: '0.5',
          lastmod: dateStr
        });
      });
    }

    // 5. Books (clean paths and query URLs)
    if (db.books && Array.isArray(db.books)) {
      db.books.forEach(item => {
        urls.push({
          loc: `${baseUrl}/book/${item.id}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: today
        });
        urls.push({
          loc: `${baseUrl}/?tab=books&amp;bookId=${item.id}`,
          changefreq: 'monthly',
          priority: '0.5',
          lastmod: today
        });
      });
    }

    // 6. Categories, Tags, and Authors
    const categories = new Set<string>();
    const tags = new Set<string>();
    const authors = new Set<string>();

    const scanContent = (items: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        if (item.category) categories.add(item.category.trim());
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((t: string) => {
            if (t && typeof t === 'string') tags.add(t.trim());
          });
        }
        if (item.author) authors.add(item.author.trim());
      });
    };

    scanContent(db.news || []);
    scanContent(db.blogs || []);

    categories.forEach(cat => {
      urls.push({
        loc: `${baseUrl}/category/${encodeURIComponent(cat.toLowerCase())}`,
        changefreq: 'weekly',
        priority: '0.5',
        lastmod: today
      });
    });

    tags.forEach(tag => {
      urls.push({
        loc: `${baseUrl}/tag/${encodeURIComponent(tag.toLowerCase())}`,
        changefreq: 'weekly',
        priority: '0.5',
        lastmod: today
      });
    });

    authors.forEach(author => {
      urls.push({
        loc: `${baseUrl}/author/${encodeURIComponent(author.toLowerCase())}`,
        changefreq: 'weekly',
        priority: '0.5',
        lastmod: today
      });
    });

    // Safeguard duplication mapping
    const seen = new Set<string>();
    const uniqueUrls: SitemapUrl[] = [];
    urls.forEach(u => {
      const canonicalLoc = u.loc.toLowerCase().trim();
      if (!seen.has(canonicalLoc)) {
        seen.add(canonicalLoc);
        uniqueUrls.push(u);
      }
    });

    return uniqueUrls;
  }

  function buildUrlSetXml(urls: SitemapUrl[]): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    urls.forEach(u => {
      xml += `
  <url>
    <loc>${u.loc}</loc>`;
      if (u.lastmod) {
        xml += `
    <lastmod>${u.lastmod}</lastmod>`;
      }
      xml += `
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
    });
    xml += `
</urlset>`;
    return xml;
  }

  function buildSitemapIndexXml(baseUrl: string, totalCount: number, limit: number): string {
    const partsCount = Math.ceil(totalCount / limit);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (let i = 1; i <= partsCount; i++) {
      xml += `
  <sitemap>
    <loc>${baseUrl}/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
    }
    xml += `
</sitemapindex>`;
    return xml;
  }

  // Dynamic sitemapindex router
  app.get('/sitemap-index.xml', (req, res) => {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    let db: AppDatabase;
    try {
      db = loadDatabase();
    } catch (e) {
      db = getInitialDBState();
    }

    const allUrls = getAllSitemapUrls(baseUrl, db);
    const xml = buildSitemapIndexXml(baseUrl, allUrls.length, 500);

    res.type('application/xml');
    res.send(xml);
  });

  // Dynamic sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    let db: AppDatabase;
    try {
      db = loadDatabase();
    } catch (e) {
      db = getInitialDBState();
    }

    const allUrls = getAllSitemapUrls(baseUrl, db);

    // If website exceeds 500 URLs, split them up and point to the sitemap index
    if (allUrls.length > 500) {
      const xml = buildSitemapIndexXml(baseUrl, allUrls.length, 500);
      res.type('application/xml');
      return res.send(xml);
    }

    // Otherwise, serve all directly in one sitemap.xml
    const xml = buildUrlSetXml(allUrls);
    res.type('application/xml');
    res.send(xml);
  });

  // Dynamic sitemap part files (e.g. sitemap-1.xml, sitemap-2.xml)
  app.get('/sitemap-:part.xml', (req, res) => {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;
    const part = parseInt(req.params.part, 10);

    if (isNaN(part) || part < 1) {
      return res.status(404).send('Not Found');
    }

    let db: AppDatabase;
    try {
      db = loadDatabase();
    } catch (e) {
      db = getInitialDBState();
    }

    const allUrls = getAllSitemapUrls(baseUrl, db);
    const limit = 500;
    const startIndex = (part - 1) * limit;
    const endIndex = startIndex + limit;

    if (startIndex >= allUrls.length) {
      return res.status(404).send('No such sitemap part');
    }

    const partUrls = allUrls.slice(startIndex, endIndex);
    const xml = buildUrlSetXml(partUrls);

    res.type('application/xml');
    res.send(xml);
  });

  // Dynamic RSS and Feed XML
  const handleRSS = (req: any, res: any) => {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    let db: AppDatabase;
    try {
      db = loadDatabase();
    } catch (e) {
      db = getInitialDBState();
    }

    res.type('application/xml');

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা</title>
  <link>${baseUrl}</link>
  <description>সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখা - সর্বজনীন গণতান্ত্রিক ও বৈজ্ঞানিক সমাজতান্ত্রিক সমাজ বিনির্মাণের লক্ষ্যে আপোষহীন প্রগতিশীল ছাত্র আন্দোলন।</description>
  <language>bn</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

    const items: any[] = [];
    if (db.news && Array.isArray(db.news)) {
      db.news.forEach(item => {
        items.push({
          title: item.title,
          link: `${baseUrl}/?tab=news&amp;newsId=${item.id}`,
          guid: `news_${item.id}`,
          description: item.excerpt || (item.content ? item.content.replace(/<[^>]*>/g, '').slice(0, 200) + '...' : ''),
          pubDate: item.date ? new Date(item.date).toUTCString() : new Date().toUTCString()
        });
      });
    }

    if (db.blogs && Array.isArray(db.blogs)) {
      db.blogs.forEach(item => {
        items.push({
          title: item.title,
          link: `${baseUrl}/?tab=news&amp;blogId=${item.id}`,
          guid: `blog_${item.id}`,
          description: item.excerpt || (item.content ? item.content.replace(/<[^>]*>/g, '').slice(0, 200) + '...' : ''),
          pubDate: item.date ? new Date(item.date).toUTCString() : new Date().toUTCString()
        });
      });
    }

    // Sort by pubDate descending
    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    items.slice(0, 30).forEach(item => {
      rss += `
  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.link}</link>
    <guid isPermaLink="false">${item.guid}</guid>
    <description><![CDATA[${item.description}]]></description>
    <pubDate>${item.pubDate}</pubDate>
  </item>`;
    });

    rss += `
</channel>
</rss>`;

    res.send(rss);
  };

  app.get('/rss.xml', handleRSS);
  app.get('/feed.xml', handleRSS);

  // API Route - Log audit actions
  app.post('/api/logs', (req, res) => {
    const { action, user, details } = req.body;
    const db = loadDatabase();
    const newLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: action || 'Unknown Action',
      user: user || 'Anonymous User',
      details: details || ''
    };
    db.logs.unshift(newLog);
    // Limit to last 150 logs
    if (db.logs.length > 150) {
      db.logs = db.logs.slice(0, 150);
    }
    saveDatabase(db);
    res.json(newLog);
  });

  // API Route - Register page visit/analytics
  app.post('/api/analytics/visit', (req, res) => {
    const { page, device } = req.body;
    const db = loadDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create daily check
    const existing = db.visits.find(v => v.date === today && v.page === page && v.device === device);
    if (existing) {
      existing.views += 1;
    } else {
      db.visits.push({
        id: 'v_' + Date.now() + Math.random().toString(36).substring(2, 7),
        date: today,
        page: page || 'General',
        views: 1,
        device: device || 'desktop'
      });
    }
    saveDatabase(db);
    res.json({ success: true });
  });

  // API Route - Increment news view counter
  app.post('/api/news/:id/view', (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.news.findIndex(n => n.id === id);
    if (index !== -1) {
      db.news[index].views = (db.news[index].views || 0) + 1;
      saveDatabase(db);
      return res.json({ success: true, views: db.news[index].views });
    }
    res.status(404).json({ error: 'News article not found' });
  });

  // API Route - Increment blog view counter
  app.post('/api/blogs/:id/view', (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();
    const index = db.blogs.findIndex(b => b.id === id);
    if (index !== -1) {
      db.blogs[index].views = (db.blogs[index].views || 0) + 1;
      saveDatabase(db);
      return res.json({ success: true, views: db.blogs[index].views });
    }
    res.status(404).json({ error: 'Blog post not found' });
  });

  // API Route - Reset Database
  app.post('/api/db/reset', (req, res) => {
    const { userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized database reset action' });
    }
    const freshDb = getInitialDBState();
    freshDb.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ডাটাবেজ রিসেট',
      user: userEmail,
      details: 'সম্পূর্ণ ডাটাবেজ প্রাথমিক অবস্থায় ফিরিয়ে নেওয়া হয়েছে।'
    });
    saveDatabase(freshDb);
    res.json(freshDb);
  });

  // CRUD API: Create/Update/Delete News
  app.post('/api/news', (req, res) => {
    const { article, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized content creation' });
    }
    const db = loadDatabase();
    const newArticle = {
      ...article,
      id: 'news_' + Date.now(),
      views: 0,
      date: new Date().toISOString().split('T')[0]
    };
    db.news.unshift(newArticle);
    
    // Add audit log
    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সংবাদ প্রকাশ',
      user: userEmail,
      details: `নতুন সংবাদ শিরোনাম: "${newArticle.title}" তৈরি করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(newArticle);
  });

  app.put('/api/news/:id', (req, res) => {
    const { id } = req.params;
    const { article, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized content edit' });
    }
    const db = loadDatabase();
    const index = db.news.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'News non-existent' });

    db.news[index] = { ...db.news[index], ...article };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সংবাদ সংশোধন',
      user: userEmail,
      details: `সংবাদ শিরোনাম: "${db.news[index].title}" সংশোধন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(db.news[index]);
  });

  app.delete('/api/news/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const db = loadDatabase();
    const target = db.news.find(n => n.id === id);
    db.news = db.news.filter(n => n.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সংবাদ মুছে ফেলা',
      user: validatedEmail,
      details: `সংবাদ শিরোনাম: "${target ? target.title : id}" মুছে ফেলা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // CRUD API: Blogs & Comments
  app.post('/api/blogs', (req, res) => {
    const { blogPost, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }
    const db = loadDatabase();
    const newBlog = {
      ...blogPost,
      id: 'blog_' + Date.now(),
      views: 0,
      comments: [],
      date: new Date().toISOString().split('T')[0]
    };
    db.blogs.unshift(newBlog);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ব্লগ প্রকাশ',
      user: userEmail,
      details: `নতুন মননশীল নিবন্ধ: "${newBlog.title}" প্রকাশ করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(newBlog);
  });

  app.put('/api/blogs/:id', (req, res) => {
    const { id } = req.params;
    const { blogPost, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }
    const db = loadDatabase();
    const index = db.blogs.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Blog not found' });

    db.blogs[index] = { ...db.blogs[index], ...blogPost };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ব্লগ সংশোধন',
      user: userEmail,
      details: `ব্লগ প্রবন্ধ: "${db.blogs[index].title}" সংশোধন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(db.blogs[index]);
  });

  app.delete('/api/blogs/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const db = loadDatabase();
    const target = db.blogs.find(b => b.id === id);
    db.blogs = db.blogs.filter(b => b.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ব্লগ মুছে ফেলা',
      user: validatedEmail,
      details: `ব্লগ প্রবন্ধ: "${target ? target.title : id}" মুছে ফেলা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // Blog Comments
  app.post('/api/blogs/:id/comments', (req, res) => {
    const { id } = req.params;
    const { authorName, authorEmail, text } = req.body;
    const db = loadDatabase();
    
    const blog = db.blogs.find(b => b.id === id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const newComment = {
      id: 'c_' + Date.now(),
      authorName: authorName || 'নামবিহীন কর্মী',
      authorEmail: authorEmail || '',
      text: text || '',
      date: new Date().toISOString().split('T')[0],
      approved: isSuperAdmin(authorEmail) // Auto-approve Super Admin comments
    };

    if (!blog.comments) blog.comments = [];
    blog.comments.push(newComment);

    saveDatabase(db);
    res.json(newComment);
  });

  // Approve Comment
  app.put('/api/blogs/:blogId/comments/:commentId/approve', (req, res) => {
    const { blogId, commentId } = req.params;
    const validatedEmail = req.headers['user-email'] as string;
    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const db = loadDatabase();
    const blog = db.blogs.find(b => b.id === blogId);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const comment = blog.comments?.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    comment.approved = true;

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'মন্তব্য অনুমোদন',
      user: validatedEmail,
      details: `ব্লগ নিবন্ধ "${blog.title}"-এর মন্তব্যে "${comment.authorName}"-এর লেখা অনুমোদন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // CRUD API: Events
  app.post('/api/events', (req, res) => {
    const { event, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const newEvent = {
      ...event,
      id: 'event_' + Date.now(),
      registrants: []
    };
    db.events.unshift(newEvent);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ইভেন্ট প্রকাশ',
      user: userEmail,
      details: `নতুন ইভেন্ট: "${newEvent.title}" সংযোজন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(newEvent);
  });

  app.put('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const { event, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const index = db.events.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ error: 'Event not found' });

    db.events[index] = { ...db.events[index], ...event };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ইভেন্ট সংশোধন',
      user: userEmail,
      details: `ইভেন্ট তথ্য: "${db.events[index].title}" সংশোধন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(db.events[index]);
  });

  app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const db = loadDatabase();
    const target = db.events.find(e => e.id === id);
    db.events = db.events.filter(e => e.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'ইভেন্ট মুছে ফেলা',
      user: validatedEmail,
      details: `ইভেন্ট: "${target ? target.title : id}" অপসারণ করা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // Register for Event
  app.post('/api/events/:id/register', (req, res) => {
    const { id } = req.params;
    const { name, email, phone, institution } = req.body;
    
    const db = loadDatabase();
    const event = db.events.find(e => e.id === id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const newRegistrant = {
      id: 'reg_' + Date.now(),
      name: name || 'পরিচিত নাম',
      email: email || '',
      phone: phone || '',
      institution: institution || 'শিক্ষাঙ্গন',
      appliedAt: new Date().toISOString().split('T')[0]
    };

    if (!event.registrants) event.registrants = [];
    event.registrants.push(newRegistrant);

    saveDatabase(db);
    res.json(newRegistrant);
  });

  // CRUD API: Books / Publications
  app.post('/api/books', (req, res) => {
    const { book, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const newBook = {
      ...book,
      id: 'book_' + Date.now(),
      downloadCount: 0,
      date: new Date().toISOString().split('T')[0]
    };
    db.books.unshift(newBook);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'প্রকাশনা প্রকাশ',
      user: userEmail,
      details: `নতুন রাজনৈতিক বই/পুস্তিকা: "${newBook.title}" সংকলনে যোগ করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(newBook);
  });

  app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { book, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const index = db.books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Book non-existent' });

    db.books[index] = { ...db.books[index], ...book };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'প্রকাশনা সংশোধন',
      user: userEmail,
      details: `বই/পুস্তিকা তথ্য: "${db.books[index].title}" সংশোধন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(db.books[index]);
  });

  app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = loadDatabase();
    const target = db.books.find(b => b.id === id);
    db.books = db.books.filter(b => b.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'প্রকাশনা অপসারণ',
      user: validatedEmail,
      details: `প্রকাশনা পুস্তিকা "${target ? target.title : id}" সারণী থেকে মুছে ফেলা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // Track book download count
  app.post('/api/books/:id/download', (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();
    const book = db.books.find(b => b.id === id);
    if (book) {
      book.downloadCount += 1;
      saveDatabase(db);
      res.json({ success: true, count: book.downloadCount });
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  });

  // CRUD API: Circulars
  app.post('/api/circulars', (req, res) => {
    const { circular, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const newCircular = {
      ...circular,
      id: 'circ_' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    db.circulars.unshift(newCircular);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সার্কুলার জারি',
      user: userEmail,
      details: `বিজ্ঞপ্তি / রেজোলিউশন শিরোনাম: "${newCircular.title}" প্রকাশ করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(newCircular);
  });

  app.put('/api/circulars/:id', (req, res) => {
    const { id } = req.params;
    const { circular, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const index = db.circulars.findIndex(c => c.id === id);
    if (index === -1) return res.status(444).json({ error: 'Circular not found' });

    db.circulars[index] = { ...db.circulars[index], ...circular };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সার্কুলার সংশোধন',
      user: userEmail,
      details: `বিজ্ঞপ্তি শিরোনাম: "${db.circulars[index].title}" সংশোধন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(db.circulars[index]);
  });

  app.delete('/api/circulars/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = loadDatabase();
    const target = db.circulars.find(c => c.id === id);
    db.circulars = db.circulars.filter(c => c.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সার্কুলার অপসারণ',
      user: validatedEmail,
      details: `সার্কুলার "${target ? target.title : id}" মুছে ফেলা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // CRUD API: Gallery
  app.post('/api/gallery', (req, res) => {
    const { item, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    const newItem = {
      ...item,
      id: 'gal_' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    db.gallery.unshift(newItem);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'মিডিয়া ফাইল আপলোড',
      user: userEmail,
      details: `মিডিয়া গ্যালারিতে "${newItem.title}" যোগ করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(newItem);
  });

  app.delete('/api/gallery/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = loadDatabase();
    const target = db.gallery.find(g => g.id === id);
    db.gallery = db.gallery.filter(g => g.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'মিডিয়া অপসারণ',
      user: validatedEmail,
      details: `গ্যালারি মিডিয়া "${target ? target.title : id}" মুছে ফেলা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // CRUD API: Memberships
  app.post('/api/memberships', (req, res) => {
    const { registration } = req.body;
    const db = loadDatabase();
    const newReg = {
      ...registration,
      id: 'member_' + Date.now(),
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0]
    };
    db.memberships.unshift(newReg);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সদস্যপদ আবেদন',
      user: 'অনলাইন আবেদনকারী',
      details: `নতুন সদস্যপদ আবেদন পেশ করা হয়েছে। নাম: "${newReg.name}", শিক্ষাঙ্গন: "${newReg.institution}"`
    });

    saveDatabase(db);
    res.json(newReg);
  });

  app.put('/api/memberships/:id/verify', (req, res) => {
    const { id } = req.params;
    const { status, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }
    const db = loadDatabase();
    const index = db.memberships.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ error: 'Membership not found' });

    db.memberships[index].status = status; // 'verified' or 'rejected' or 'pending'
    if (status === 'verified') {
      db.memberships[index].verifiedAt = new Date().toISOString().split('T')[0];
    }

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: `সদস্যতা স্ট্যাটাস পরিবর্তন: ${status === 'verified' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`,
      user: userEmail,
      details: `আবেদনকারী "${db.memberships[index].name}"-এর সদস্যতা যাচাই স্ট্যাটাস পরিবর্তন করা হয়েছে।`
    });

    saveDatabase(db);
    res.json(db.memberships[index]);
  });

  app.put('/api/memberships/:id/photo', (req, res) => {
    const { id } = req.params;
    const { photoUrl } = req.body;
    const db = loadDatabase();
    const index = db.memberships.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ error: 'Membership not found' });

    db.memberships[index].photoUrl = photoUrl;
    
    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'প্রোফাইল ছবি পরিবর্তন',
      user: db.memberships[index].email,
      details: `সদস্য "${db.memberships[index].name}" তাঁর প্রোফাইল ছবি সফলভাবে আপডেট করেছেন।`
    });

    saveDatabase(db);
    res.json(db.memberships[index]);
  });

  app.delete('/api/memberships/:id', (req, res) => {
    const { id } = req.params;
    const validatedEmail = (req.headers['user-email'] as string) || (req.query.userEmail as string) || (req.body && req.body.userEmail);

    if (!isSuperAdmin(validatedEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = loadDatabase();
    const target = db.memberships.find(m => m.id === id);
    db.memberships = db.memberships.filter(m => m.id !== id);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'আবেদন মুছে ফেলা',
      user: validatedEmail,
      details: `আবেদনকারী "${target ? target.name : id}"-এর নথিপত্র ডাটাবেজ থেকে মুছে ফেলা হয়েছে।`
    });

    saveDatabase(db);
    res.json({ success: true });
  });

  // API Route - Add member login activity logs
  app.post('/api/member-logins', (req, res) => {
    const { email, status, details } = req.body;
    const db = loadDatabase();
    
    if (!db.memberLogins) {
      db.memberLogins = [];
    }

    const newLoginLog = {
      id: 'ml_' + Date.now() + Math.random().toString(36).substring(2, 5),
      email: email || 'unknown@example.com',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: status || 'failed',
      details: details || ''
    };

    db.memberLogins.unshift(newLoginLog);
    
    // Limit to latest 100 login logs
    if (db.memberLogins.length > 100) {
      db.memberLogins = db.memberLogins.slice(0, 100);
    }

    saveDatabase(db);
    res.json(newLoginLog);
  });

  // API Route - Forgot Password
  app.post('/api/member-logins/forgot-password', (req, res) => {
    const { email } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();
    const db = loadDatabase();

    if (!db.memberLogins) {
      db.memberLogins = [];
    }

    const matchedMember = db.memberships.find(
      m => m.email?.toLowerCase() === trimmedEmail && m.status === 'verified'
    );

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (matchedMember) {
      const detailsText = `পাসওয়ার্ড পুনরুদ্ধারের জন্য স্বয়ংক্রিয় নোটিফিকেশন ইমেইল ইভেন্ট জেনারেট করে পাঠানো হয়েছে। আইপি এবং সেশন ভেরিফাইড।`;
      const recoveryLog = {
        id: 'ml_forgot_' + Date.now(),
        email: trimmedEmail,
        timestamp,
        status: 'reset_request' as const,
        details: detailsText
      };

      db.memberLogins.unshift(recoveryLog);
      saveDatabase(db);

      return res.json({
        success: true,
        message: `বিপ্লবী শুভেচ্ছা, কমরেড ${matchedMember.name}। পাসওয়ার্ড পুনরুদ্ধারের লিংক ও নির্দেশনাবলী আপনার নিবন্ধিত ইমেইল এড্রেসে (${trimmedEmail}) প্রেরণ করা হয়েছে। দয়া করে স্প্যাম ফোল্ডারসহ ইনবক্স চেক করুন।`
      });
    } else {
      // Check if it belongs to a pending or rejected member
      const otherMember = db.memberships.find(m => m.email?.toLowerCase() === trimmedEmail);
      let statusMsg = 'ভুল বা অনিবন্ধিত ইমেইল দ্বারা পাসওয়ার্ড উদ্ধারের চেষ্টা করা হয়েছে।';
      if (otherMember) {
        statusMsg = `অ-অনুমোদিত ইমেইল (${trimmedEmail}, স্ট্যাটাস: ${otherMember.status}) দ্বারা পাসওয়ার্ড উদ্ধারের চেষ্টা করা হয়েছে।`;
      }

      const failedLog = {
        id: 'ml_forgot_fail_' + Date.now(),
        email: trimmedEmail,
        timestamp,
        status: 'failed' as const,
        details: statusMsg
      };

      db.memberLogins.unshift(failedLog);
      saveDatabase(db);

      return res.status(404).json({
        success: false,
        message: `দুঃখিত, '${trimmedEmail}' ইমেইলটি আমাদের ডাটাবেজে কোনো ভেরিফাইড সক্রিয় সদস্যের সাথে মেলেনি। সদস্যতার জন্য দয়া করে আবেদন করুন অথবা দপ্তরের সাথে যোগাযোগ করুন।`
      });
    }
  });

  // Save Website General Settings & layout
  app.post('/api/settings', (req, res) => {
    const { settings, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    db.settings = { ...db.settings, ...settings };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সেটিংস আপডেট',
      user: userEmail,
      details: 'ওয়েবসাইট লেআউট এবং দৃশ্যমান ব্লগ/নিউজ সেটিংস পরিবর্তন করা হয়েছে।'
    });

    saveDatabase(db);
    res.json(db.settings);
  });

  // API Route - Proxy external images to prevent CORS taint and implement caching
  app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      const parsedUrl = new URL(imageUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).send('Invalid protocol: protocol must be http or https');
      }

      // 1. Calculate cache key: SHA256(imageUrl)
      const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
      const cacheDir = path.join(process.cwd(), 'public', 'cache');
      
      // Ensure cache directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cachePath = path.join(cacheDir, hash);
      const metaPath = path.join(cacheDir, `${hash}.json`);

      // 2. Check if cache exists and is less than 30 days old
      let useCache = false;
      if (fs.existsSync(cachePath) && fs.existsSync(metaPath)) {
        try {
          const stats = fs.statSync(cachePath);
          const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
          if (ageInDays < 30) {
            useCache = true;
          }
        } catch (err) {
          console.warn('[Proxy] Error reading cache file stats:', err);
        }
      }

      if (useCache) {
        console.log(`[Proxy] Cache HIT for: ${imageUrl} (Hash: ${hash})`);
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          const buffer = fs.readFileSync(cachePath);

          res.setHeader('Content-Type', meta.contentType || 'image/png');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=2592000'); // Cache for 30 days in browser too
          res.setHeader('X-Cache', 'HIT');
          return res.send(buffer);
        } catch (cacheReadErr) {
          console.error('[Proxy] Failed to read cached image, falling back to download:', cacheReadErr);
        }
      }

      // 3. Cache Miss - Download & Validate image
      console.log(`[Proxy] Cache MISS. Fetching external image: ${imageUrl}`);
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`[Proxy] Failed to fetch remote image. HTTP Status: ${response.status}`);
        return res.status(response.status).send(`Image could not be loaded: ${imageUrl} (Status: ${response.status})`);
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      if (!contentType.startsWith('image/')) {
        console.error(`[Proxy] Invalid MIME type fetched: ${contentType}`);
        return res.status(400).send(`Image could not be loaded: ${imageUrl} (Invalid MIME type: ${contentType})`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to cache
      try {
        fs.writeFileSync(cachePath, buffer);
        fs.writeFileSync(metaPath, JSON.stringify({
          originalUrl: imageUrl,
          contentType,
          timestamp: Date.now()
        }, null, 2));
        console.log(`[Proxy] Successfully saved image to cache: ${hash}`);
      } catch (saveErr) {
        console.error('[Proxy] Failed to write image to disk cache:', saveErr);
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // Cache for 30 days
      res.setHeader('X-Cache', 'MISS');
      res.send(buffer);
    } catch (err: any) {
      console.error('[Proxy] Error proxying image:', err);
      res.status(500).send(`Error proxying image: ${err.message}`);
    }
  });

  // Get all organizations
  app.get('/api/organizations', (req, res) => {
    const db = loadDatabase();
    res.json(db.organizations || []);
  });

  // Save all organizations (logos etc.)
  app.post('/api/organizations', (req, res) => {
    const { organizations, userEmail } = req.body;
    if (!isSuperAdmin(userEmail)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const db = loadDatabase();
    db.organizations = organizations;

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'সহযোগী সংগঠনসমূহ আপডেট',
      user: userEmail,
      details: 'অঙ্গসংগঠন সমূহের লগো বা বিস্তারিত তথ্য আপডেট করা হয়েছে।'
    });

    saveDatabase(db);
    res.json(db.organizations);
  });

  // Admin Invitations endpoints
  app.get('/api/invitations', (req, res) => {
    const db = loadDatabase();
    res.json(db.invitations || []);
  });

  app.post('/api/invitations', (req, res) => {
    const { email, role, invitedBy } = req.body;
    if (!isSuperAdmin(invitedBy)) {
      return res.status(403).json({ error: 'Unauthorized to send invitations' });
    }
    
    const cleanEmail = email.trim().toLowerCase();
    const db = loadDatabase();
    if (!db.invitations) db.invitations = [];

    // Remove existing invites for same email to avoid duplicates
    db.invitations = db.invitations.filter(i => i.email.toLowerCase() !== cleanEmail);

    const newInvite = {
      id: 'invite_' + Date.now(),
      email: cleanEmail,
      role: role || 'admin',
      status: 'pending' as 'pending' | 'accepted' | 'declined',
      invitedBy: invitedBy,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    db.invitations.unshift(newInvite);

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'এডমিন নিমন্ত্রণ পাঠানো হয়েছে',
      user: invitedBy,
      details: `${cleanEmail} কমরেডকে ${role === 'super_admin' ? 'সুপার এডমিন' : 'সমন্বয়ক এডমিন'} হিসেবে দায়িত্ব বা প্যানেল নিমন্ত্রণ পাঠানো হয়েছে।`
    });

    saveDatabase(db);
    res.json(newInvite);
  });

  app.post('/api/invitations/:id/action', (req, res) => {
    const { id } = req.params;
    const { action, email } = req.body; // 'accepted' or 'declined'
    const db = loadDatabase();
    if (!db.invitations) db.invitations = [];

    const index = db.invitations.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invite = db.invitations[index];
    invite.status = action;

    // Log the accept/decline action
    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: `নিমন্ত্রণ ${action === 'accepted' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`,
      user: email || invite.email,
      details: `কমরেড ${invite.email} এডমিন নিমন্ত্রণ ${action === 'accepted' ? 'সরাসরি গ্রহণ করে পূর্ণ এডমিন প্যানেল এক্সেস সেশন চালু করেছেন।' : 'প্রত্যাখ্যান করেছেন।'}`
    });

    saveDatabase(db);
    res.json(invite);
  });

  // Helper for enterprise SEO dynamic meta tag injection
  const getDynamicSEO = (req: any, db: AppDatabase) => {
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;
    const currentUrl = `${baseUrl}${req.originalUrl}`;

    const defaultTitle = "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা";
    const defaultDesc = "সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখা - সর্বজনীন গণতান্ত্রিক ও বৈজ্ঞানিক সমাজতান্ত্রিক সমাজ বিনির্মাণের লক্ষ্যে আপোষহীন প্রগতিশীল ছাত্র আন্দোলন।";
    const defaultImage = "https://i.ibb.co.com/F4MKM3R2/20260527-055637.png";

    let title = defaultTitle;
    let description = defaultDesc;
    let image = defaultImage;
    let type = "website";
    let schema: any = null;

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": defaultImage
      },
      "sameAs": [
        "https://www.facebook.com/sf.mymensingh"
      ]
    };

    const breadcrumbListSchema = (steps: { name: string, item: string }[]) => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": steps.map((step, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": step.name,
        "item": step.item
      }))
    });

    const query = req.query || {};

    if (query.newsId && db.news) {
      const newsItem = db.news.find((n: any) => n.id === query.newsId);
      if (newsItem) {
        title = `${newsItem.title} | ${defaultTitle}`;
        description = newsItem.excerpt || (newsItem.content ? newsItem.content.replace(/<[^>]*>/g, '').slice(0, 150) + '...' : defaultDesc);
        image = newsItem.image || defaultImage;
        type = "article";
        schema = [
          orgSchema,
          {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": currentUrl
            },
            "headline": newsItem.title,
            "description": description,
            "image": image,
            "datePublished": newsItem.date ? new Date(newsItem.date).toISOString() : new Date().toISOString(),
            "author": {
              "@type": "Organization",
              "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা"
            },
            "publisher": orgSchema
          },
          breadcrumbListSchema([
            { name: "প্রচ্ছদ", item: baseUrl },
            { name: "সংবাদ ও কলাম", item: `${baseUrl}/?tab=news` },
            { name: newsItem.title, item: currentUrl }
          ])
        ];
      }
    } else if (query.blogId && db.blogs) {
      const blogItem = db.blogs.find((b: any) => b.id === query.blogId);
      if (blogItem) {
        title = `${blogItem.title} | ${defaultTitle}`;
        description = blogItem.excerpt || (blogItem.content ? blogItem.content.replace(/<[^>]*>/g, '').slice(0, 150) + '...' : defaultDesc);
        image = blogItem.image || defaultImage;
        type = "article";
        schema = [
          orgSchema,
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": currentUrl
            },
            "headline": blogItem.title,
            "description": description,
            "image": image,
            "datePublished": blogItem.date ? new Date(blogItem.date).toISOString() : new Date().toISOString(),
            "author": {
              "@type": "Person",
              "name": blogItem.author || "কমরেড লেখক"
            },
            "publisher": orgSchema
          },
          breadcrumbListSchema([
            { name: "প্রচ্ছদ", item: baseUrl },
            { name: "নিবন্ধ ও কলাম", item: `${baseUrl}/?tab=news` },
            { name: blogItem.title, item: currentUrl }
          ])
        ];
      }
    } else if (query.eventId && db.events) {
      const eventItem = db.events.find((e: any) => e.id === query.eventId);
      if (eventItem) {
        title = `${eventItem.title} | ${defaultTitle}`;
        description = eventItem.description || `সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা সংসদের আয়োজন। তারিখ: ${eventItem.date}, ভেন্যু: ${eventItem.venue}`;
        image = defaultImage;
        type = "event";
        schema = [
          orgSchema,
          {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": eventItem.title,
            "description": description,
            "startDate": eventItem.date ? new Date(eventItem.date).toISOString() : new Date().toISOString(),
            "location": {
              "@type": "Place",
              "name": eventItem.venue || "ময়মনসিংহ জেলা কার্যালয়",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Mymensingh",
                "addressRegion": "Mymensingh Division",
                "addressCountry": "BD"
              }
            },
            "organizer": orgSchema
          },
          breadcrumbListSchema([
            { name: "প্রচ্ছদ", item: baseUrl },
            { name: "কর্মসূচী", item: `${baseUrl}/?tab=events` },
            { name: eventItem.title, item: currentUrl }
          ])
        ];
      }
    } else if (query.bookId && db.books) {
      const bookItem = db.books.find((b: any) => b.id === query.bookId);
      if (bookItem) {
        title = `${bookItem.title} | ${defaultTitle}`;
        description = bookItem.description || `সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার প্রকাশনা - ${bookItem.title}। লেখক: ${bookItem.author}`;
        image = bookItem.coverImage || defaultImage;
        type = "book";
        schema = [
          orgSchema,
          {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": bookItem.title,
            "author": {
              "@type": "Person",
              "name": bookItem.author
            },
            "description": description,
            "image": image,
            "publisher": orgSchema
          },
          breadcrumbListSchema([
            { name: "প্রচ্ছদ", item: baseUrl },
            { name: "শিক্ষা ও প্রকাশনা", item: `${baseUrl}/?tab=books` },
            { name: bookItem.title, item: currentUrl }
          ])
        ];
      }
    } else if (query.tab) {
      const tabNames: Record<string, string> = {
        news: "সংবাদ ও কলাম",
        books: "শিক্ষা ও প্রকাশনা",
        events: "আসন্ন ইভেন্ট ও কর্মসূচী",
        circulars: "সাংগঠনিক সার্কুলার",
        about: "আমাদের সম্পর্কে ও গঠনতন্ত্র",
        join: "অনলাইন সদস্যপদ আবেদন ফরম",
        portal: "মেম্বার ও কমরেড পোর্টাল",
        media: "ফটোগ্রাফি ও মিডিয়া সেন্টার",
        contact: "যোগাযোগ করুন"
      };
      if (tabNames[query.tab]) {
        title = `${tabNames[query.tab]} | ${defaultTitle}`;
        schema = [
          orgSchema,
          breadcrumbListSchema([
            { name: "প্রচ্ছদ", item: baseUrl },
            { name: tabNames[query.tab], item: currentUrl }
          ])
        ];
      }
    } else {
      schema = [
        orgSchema,
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          "url": baseUrl,
          "name": defaultTitle,
          "description": defaultDesc,
          "publisher": orgSchema
        }
      ];
    }

    return { title, description, image, type, currentUrl, schema };
  };

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true
    }));

    let cachedHtml: string | null = null;
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return res.status(404).json({ error: 'Not found' });
      }

      let db: AppDatabase;
      try {
        db = loadDatabase();
      } catch (e) {
        db = getInitialDBState();
      }

      const seo = getDynamicSEO(req, db);

      const serveHtml = (baseHtml: string) => {
        const replacement = `
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <link rel="canonical" href="${seo.currentUrl}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${seo.type}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:image" content="${seo.image}" />
    <meta property="og:url" content="${seo.currentUrl}" />
    <meta property="og:site_name" content="সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা" />
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seo.title}" />
    <meta name="twitter:description" content="${seo.description}" />
    <meta name="twitter:image" content="${seo.image}" />
    ${seo.schema ? `<script type="application/ld+json">${JSON.stringify(seo.schema)}</script>` : ''}
        `;

        let output = baseHtml;
        output = output.replace(/<title>[^]*?<\/title>/gi, '');
        output = output.replace(/<meta\s+name="description"\s+content="[^]*?"\s*\/?>/gi, '');
        output = output.replace('</head>', `${replacement}\n</head>`);
        res.send(output);
      };

      if (cachedHtml) {
        serveHtml(cachedHtml);
      } else {
        const indexPath = path.join(distPath, 'index.html');
        fs.readFile(indexPath, 'utf-8', (err, content) => {
          if (err) {
            return res.sendFile(indexPath);
          }
          cachedHtml = content;
          serveHtml(content);
        });
      }
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
