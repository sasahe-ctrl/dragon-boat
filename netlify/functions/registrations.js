const fs = require('fs');
const path = require('path');
const DATA_FILE = process.env.NETLIFY ? '/tmp/registrations.json' : path.join(__dirname, '../../data/registrations.json');

exports.handler = async (event) => {
    const auth = event.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: '未授权' }) };
    }

    if (!fs.existsSync(DATA_FILE)) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, data: [], pagination: { total: 0, page: 1, totalPages: 0 } })
        };
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const params = event.queryStringParameters || {};
    const search = (params.search || '').toLowerCase();
    const session = params.session || '';
    const status = params.status || '';
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 50;

    let filtered = data;
    if (search) {
        filtered = filtered.filter(r => r.name.toLowerCase().includes(search) || r.phone.includes(search) || r.email.includes(search));
    }
    if (session) filtered = filtered.filter(r => r.session === session);
    if (status) filtered = filtered.filter(r => r.status === status);

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: true,
            data: paginated,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        })
    };
};