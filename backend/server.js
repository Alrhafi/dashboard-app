const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// Ambil DATABASE_URL dari environment variable (sudah diatur di Railway)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Wajib untuk Supabase
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Endpoint dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        // Ambil metrik
        const metrics = await pool.query('SELECT * FROM dashboard_metrics LIMIT 1');
        const revenue = metrics.rows[0]?.total_revenue || 0;
        const activeUsers = metrics.rows[0]?.active_users || 0;
        const totalOrders = metrics.rows[0]?.total_orders || 0;
        const avgRating = metrics.rows[0]?.avg_rating || 0;

        // Ambil data chart penjualan
        const chart = await pool.query('SELECT month, sales FROM monthly_sales ORDER BY id');
        const labels = chart.rows.map(r => r.month);
        const salesData = chart.rows.map(r => r.sales);

        // Ambil aktivitas
        const activitiesRes = await pool.query(
            'SELECT user_name, action, time, badge FROM activities ORDER BY id DESC LIMIT 5'
        );
        const activities = activitiesRes.rows.map(r => ({
            user: r.user_name,
            action: r.action,
            time: r.time,
            badge: r.badge
        }));

        // Ambil produk terlaris
        const productsRes = await pool.query(
            'SELECT name, sold, icon FROM top_products ORDER BY sold DESC LIMIT 4'
        );
        const topProducts = productsRes.rows;

        res.json({
            revenue,
            activeUsers,
            totalOrders,
            avgRating,
            salesChart: { labels, data: salesData },
            activities,
            topProducts
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});