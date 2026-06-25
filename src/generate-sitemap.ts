import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Read config files
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const dbPath = path.resolve(process.cwd(), 'db.json');

async function run() {
  console.log('--- Generating Dynamic Sitemap from Firestore/Local DB ---');
  
  let newsList: any[] = [];
  let blogsList: any[] = [];
  let eventsList: any[] = [];
  let booksList: any[] = [];

  // Try to connect and fetch from Firestore first
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log(`Connecting to Firestore Database: ${config.firestoreDatabaseId}...`);
      
      const app = initializeApp(config);
      const db = getFirestore(app, config.firestoreDatabaseId);

      // Fetch News
      try {
        const newsSnap = await getDocs(collection(db, 'news'));
        newsList = newsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`Fetched ${newsList.length} news items from Firestore.`);
      } catch (err) {
        console.warn('Could not fetch news from Firestore:', err instanceof Error ? err.message : err);
      }

      // Fetch Blogs
      try {
        const blogsSnap = await getDocs(collection(db, 'blogs'));
        blogsList = blogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`Fetched ${blogsList.length} blogs from Firestore.`);
      } catch (err) {
        console.warn('Could not fetch blogs from Firestore:', err instanceof Error ? err.message : err);
      }

      // Fetch Events
      try {
        const eventsSnap = await getDocs(collection(db, 'events'));
        eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`Fetched ${eventsList.length} events from Firestore.`);
      } catch (err) {
        console.warn('Could not fetch events from Firestore:', err instanceof Error ? err.message : err);
      }

      // Fetch Books
      try {
        const booksSnap = await getDocs(collection(db, 'books'));
        booksList = booksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`Fetched ${booksList.length} books from Firestore.`);
      } catch (err) {
        console.warn('Could not fetch books from Firestore:', err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.error('Firestore connection error. Falling back to local db.json...', err);
  }

  // Fallback to local db.json if lists are empty
  if (newsList.length === 0 && blogsList.length === 0 && eventsList.length === 0) {
    console.log('Reading from local db.json fallback...');
    if (fs.existsSync(dbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        newsList = db.news || [];
        blogsList = db.blogs || [];
        eventsList = db.events || [];
        booksList = db.books || [];
        console.log(`Loaded fallback data: ${newsList.length} news, ${blogsList.length} blogs, ${eventsList.length} events, ${booksList.length} books.`);
      } catch (e) {
        console.error('Could not read db.json fallback:', e);
      }
    }
  }

  const host = 'sf-mymensingh.org'; // Target production/live domain, or fallback
  const baseUrl = `https://${host}`;
  const today = new Date().toISOString().split('T')[0];

  // Helper types and functions for sitemap architecture
  interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: string;
  }

  const urls: SitemapUrl[] = [];

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
  newsList.forEach(item => {
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

  // 3. Blog Posts (clean paths and query URLs)
  blogsList.forEach(item => {
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

  // 4. Events (clean paths and query URLs)
  eventsList.forEach(item => {
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

  // 5. Books (clean paths and query URLs)
  booksList.forEach(item => {
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

  scanContent(newsList);
  scanContent(blogsList);

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

  // Generate primary sitemap and sitemap-index files
  const mainSitemapXml = buildUrlSetXml(uniqueUrls);
  const sitemapIndexXml = buildSitemapIndexXml(baseUrl, uniqueUrls.length, 500);

  // Write files to root
  fs.writeFileSync(path.resolve(process.cwd(), 'sitemap.xml'), mainSitemapXml, 'utf-8');
  fs.writeFileSync(path.resolve(process.cwd(), 'sitemap-index.xml'), sitemapIndexXml, 'utf-8');
  console.log(`Successfully generated sitemap.xml and sitemap-index.xml in root (Total URLs: ${uniqueUrls.length})!`);

  // Write sitemap chunk parts statically if we have more than 500
  const limit = 500;
  const partsCount = Math.ceil(uniqueUrls.length / limit);
  for (let i = 1; i <= partsCount; i++) {
    const partUrls = uniqueUrls.slice((i - 1) * limit, i * limit);
    const partXml = buildUrlSetXml(partUrls);
    fs.writeFileSync(path.resolve(process.cwd(), `sitemap-${i}.xml`), partXml, 'utf-8');
  }

  // Also write to dist/ if dist folder exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), mainSitemapXml, 'utf-8');
    fs.writeFileSync(path.resolve(distDir, 'sitemap-index.xml'), sitemapIndexXml, 'utf-8');
    for (let i = 1; i <= partsCount; i++) {
      const partUrls = uniqueUrls.slice((i - 1) * limit, i * limit);
      const partXml = buildUrlSetXml(partUrls);
      fs.writeFileSync(path.resolve(distDir, `sitemap-${i}.xml`), partXml, 'utf-8');
    }
    console.log('Successfully copied sitemap and sitemap index files to dist/ folder!');
  }
}

run().catch(console.error);
