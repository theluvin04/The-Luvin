const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');
const FRONTEND_PATH = path.join(__dirname, '../frontend');
const PUBLIC_PATH = path.join(__dirname, '../public'); // Path to the new public directory

// --- Middleware Setup ---
app.use(express.json({ limit: '10mb' }));

// Serve static assets from the root 'public' directory
app.use(express.static(PUBLIC_PATH)); 
// Serve the frontend application's built files (HTML, JS, CSS)
app.use(express.static(FRONTEND_PATH));

app.use(session({
  secret: 'a-very-secret-key-for-the-luvin-app',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));


// --- Database Helper Functions ---
let db = {};
const loadDb = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    db = JSON.parse(data);
  } catch (error) {
    console.error('Error loading DB:', error);
    db = { users: {}, products: { frames: [], lego_parts: {} }, backgrounds: { square: [], rectangle: [] }, orders: {} };
  }
};
const writeDb = () => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};
loadDb();


// --- Authentication Middleware ---
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).json({ message: 'Forbidden' });
};


// --- API Endpoints ---

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users[username];
  if (user && user.password === password) {
    req.session.user = { username: user.username, role: user.role };
    res.json({ message: 'Login successful', user: req.session.user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logout successful' }));
});

app.get('/api/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// PRODUCTS (Public)
app.get('/api/products', (req, res) => {
    res.json(db.products);
});

// PRODUCT MANAGEMENT (Admin only)
app.post('/api/products', isAuthenticated, isAdmin, (req, res) => {
    const { type, category, product } = req.body;
    if (type === 'frame') {
        db.products.frames.push(product);
    } else if (type === 'lego_part' && category) {
        db.products.lego_parts[category].push(product);
    }
    writeDb();
    res.status(201).json(product);
});

app.patch('/api/products/:type/:category/:id', isAuthenticated, isAdmin, (req, res) => {
    const { type, category, id } = req.params;
    const updatedProduct = req.body;

    if (type === 'frame') {
        const index = db.products.frames.findIndex(p => p.id === id);
        if (index > -1) {
            db.products.frames[index] = { ...db.products.frames[index], ...updatedProduct };
        }
    } else if (type === 'lego_part' && db.products.lego_parts[category]) {
        const index = db.products.lego_parts[category].findIndex(p => p.id === id);
        if (index > -1) {
            db.products.lego_parts[category][index] = { ...db.products.lego_parts[category][index], ...updatedProduct };
        }
    }
    writeDb();
    res.json(updatedProduct);
});

app.delete('/api/products/:type/:category/:id', isAuthenticated, isAdmin, (req, res) => {
    const { type, category, id } = req.params;
    if (type === 'frame') {
        db.products.frames = db.products.frames.filter(p => p.id !== id);
    } else if (type === 'lego_part' && db.products.lego_parts[category]) {
        db.products.lego_parts[category] = db.products.lego_parts[category].filter(p => p.id !== id);
    }
    writeDb();
    res.status(204).send();
});

// BACKGROUNDS (Public)
app.get('/api/backgrounds', (req, res) => {
    res.json(db.backgrounds || { square: [], rectangle: [] });
});

// BACKGROUND MANAGEMENT (Admin only)
app.post('/api/backgrounds/:type', isAuthenticated, isAdmin, (req, res) => {
    const { type } = req.params;
    const { name, url, category } = req.body;
    if (!['square', 'rectangle'].includes(type) || !name || !url || !category) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }
    const newBg = {
        id: `${type.slice(0,3)}-${Date.now()}`,
        name,
        url,
        category,
        isVisible: true
    };
    db.backgrounds[type].push(newBg);
    writeDb();
    res.status(201).json(newBg);
});

app.patch('/api/backgrounds/:type/:id', isAuthenticated, isAdmin, (req, res) => {
    const { type, id } = req.params;
    const updates = req.body;
    if (!['square', 'rectangle'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
    }
    const index = db.backgrounds[type].findIndex(bg => bg.id === id);
    if (index > -1) {
        db.backgrounds[type][index] = { ...db.backgrounds[type][index], ...updates };
        writeDb();
        res.json(db.backgrounds[type][index]);
    } else {
        res.status(404).json({ message: 'Background not found' });
    }
});

app.delete('/api/backgrounds/:type/:id', isAuthenticated, isAdmin, (req, res) => {
    const { type, id } = req.params;
    if (!['square', 'rectangle'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
    }
    const initialLength = db.backgrounds[type].length;
    db.backgrounds[type] = db.backgrounds[type].filter(bg => bg.id !== id);
    if (db.backgrounds[type].length < initialLength) {
        writeDb();
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Background not found' });
    }
});


// ORDERS
app.get('/api/orders', isAuthenticated, (req, res) => {
  const ordersArray = Object.values(db.orders).sort((a, b) => 
    new Date(b.details.createdAt) - new Date(a.details.createdAt)
  );
  res.json(ordersArray);
});

app.get('/api/orders/:id', (req, res) => {
  const orderId = `#${req.params.id.replace('#', '')}`;
  const order = db.orders[orderId];
  if (order) res.json(order);
  else res.status(404).json({ message: 'Order not found' });
});

app.post('/api/orders', (req, res) => {
  const newOrderDetails = req.body;
  const newOrder = {
    status: 'Chờ thanh toán',
    details: { ...newOrderDetails, createdAt: new Date().toISOString() }
  };
  db.orders[newOrder.details.orderId] = newOrder;
  writeDb();
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id/status', isAuthenticated, (req, res) => {
  const orderId = `#${req.params.id.replace('#', '')}`;
  const { status } = req.body;
  if (db.orders[orderId]) {
    db.orders[orderId].status = status;
    writeDb();
    res.json(db.orders[orderId]);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});


// DASHBOARD
app.get('/api/dashboard/stats', isAuthenticated, (req, res) => {
    const ordersArray = Object.values(db.orders);
    const totalRevenue = ordersArray.reduce((sum, order) => sum + order.details.pricing.total, 0);
    const newOrders = ordersArray.filter(o => {
        const orderDate = new Date(o.details.createdAt);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return orderDate > yesterday;
    }).length;

    const recentOrders = ordersArray
        .sort((a, b) => new Date(b.details.createdAt) - new Date(a.details.createdAt))
        .slice(0, 5);
    
    const urgentOrders = ordersArray.filter(o => {
        if (!o.details.desiredDeliveryDate) return false;
        const diffDays = (new Date(o.details.desiredDeliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays < 3;
    });

    res.json({
        totalRevenue,
        newOrdersCount: newOrders,
        averageOrderValue: ordersArray.length ? totalRevenue / ordersArray.length : 0,
        recentOrders,
        urgentOrders,
    });
});


// --- Fallback for Frontend Routing ---
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});