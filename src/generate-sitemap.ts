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
  const tabs = ['home', 'news', 'books', 'events', 'circulars', 'about', 'join', 'portal', 'media', 'contact'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // 1. Static tab routes
  tabs.forEach(tab => {
    xml += `
  <url>
    <loc>${baseUrl}/?tab=${tab}</loc>
    <changefreq>daily</changefreq>
    <priority>${tab === 'home' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  // 2. Dynamic News Articles
  newsList.forEach(item => {
    const lastMod = item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `
  <url>
    <loc>${baseUrl}/?tab=news&amp;newsId=${item.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // 3. Dynamic Blog Column Posts
  blogsList.forEach(item => {
    const lastMod = item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `
  <url>
    <loc>${baseUrl}/?tab=news&amp;blogId=${item.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  // 4. Dynamic Events
  eventsList.forEach(item => {
    const lastMod = item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `
  <url>
    <loc>${baseUrl}/?tab=events&amp;eventId=${item.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  // 5. Dynamic Books/Publications
  booksList.forEach(item => {
    xml += `
  <url>
    <loc>${baseUrl}/?tab=books&amp;bookId=${item.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  // Write sitemap.xml to root
  fs.writeFileSync(path.resolve(process.cwd(), 'sitemap.xml'), xml, 'utf-8');
  console.log('Successfully generated sitemap.xml in root!');

  // Also write to dist/ if dist folder exists
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), xml, 'utf-8');
    console.log('Successfully copied sitemap.xml to dist/ folder!');
  }
}

run().catch(console.error);
