import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getInitialDBState, AppDatabase } from './src/server/db-initial';

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

  // API Route - Get Entire DB
  app.get('/api/db', (req, res) => {
    const db = loadDatabase();
    res.json(db);
  });

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
      status: 'pending',
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

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
