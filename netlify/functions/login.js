exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { username, password } = JSON.parse(event.body);
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'duanwu2026';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, token })
        };
    }

    return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: '用户名或密码错误' })
    };
};