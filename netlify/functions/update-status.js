const fs = require('fs');
const path = require('path');
const DATA_FILE = process.env.NETLIFY ? '/tmp/registrations.json' : path.join(__dirname, '../../data/registrations.json');

exports.handler = async (event) => {
    if (event.httpMethod !== 'PATCH') return { statusCode: 405, body: 'Method Not Allowed' };

    const auth = event.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: '未授权' }) };
    }

    const id = event.path.split('/').pop();
    const { status } = JSON.parse(event.body);
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: '无效状态' }) };
    }

    if (!fs.existsSync(DATA_FILE)) {
        return { statusCode: 404, body: JSON.stringify({ success: false, message: '无数据' }) };
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const index = data.findIndex(r => r.id === id);
    if (index === -1) return { statusCode: 404, body: JSON.stringify({ success: false, message: '记录不存在' }) };

    data[index].status = status;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, message: '状态更新成功' })
    };
};