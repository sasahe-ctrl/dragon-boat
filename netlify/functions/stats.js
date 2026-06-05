const fs = require('fs');
const path = require('path');
const DATA_FILE = process.env.NETLIFY ? '/tmp/registrations.json' : path.join(__dirname, '../../data/registrations.json');

exports.handler = async (event) => {
    const auth = event.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: '未授权' }) };
    }

    let data = [];
    if (fs.existsSync(DATA_FILE)) data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    const today = new Date().toISOString().split('T')[0];
    const stats = {
        total: data.length,
        today: data.filter(r => r.created_at.startsWith(today)).length,
        sessions: {},
        statuses: {}
    };
    data.forEach(r => {
        stats.sessions[r.session] = (stats.sessions[r.session] || 0) + 1;
        stats.statuses[r.status] = (stats.statuses[r.status] || 0) + 1;
    });

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data: stats })
    };
};