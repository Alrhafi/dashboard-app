const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint untuk mengambil semua data dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        // Ambil data dari tabel 'dashboard_metrics' (satu baris)
        const metrics = await pool.query('SELECT * FROM dashboard_metrics LIMIT 1');
        const revenue = metrics.rows[0]?.total_revenue || 0;
        const activeUsers = metrics.rows[0]?.active_users || 0;
        const totalOrders = metrics.rows[0]?.total_orders || 0;
        const avgRating = metrics.rows[0]?.avg_rating || 0;

        // Ambil data chart (penjualan per bulan)
        const chartData = await pool.query('SELECT month, sales FROM monthly_sales ORDER BY id');
        const labels = chartData.rows.map(r => r.month);
        const salesData = chartData.rows.map(r => r.sales);

        // Ambil aktivitas terbaru
        const activitiesRes = await pool.query('SELECT user_name, action, time, badge FROM activities ORDER BY id DESC LIMIT 5');
        const activities = activitiesRes.rows.map(r => ({
            user: r.user_name,
            action: r.action,
            time: r.time,
            badge: r.badge
        }));

        // Ambil produk terlaris
        const productsRes = await pool.query('SELECT name, sold, icon FROM top_products ORDER BY sold DESC LIMIT 4');
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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});