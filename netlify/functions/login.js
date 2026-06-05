const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'duanwu2026';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 简单 token：用户名+时间戳 base64
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, token }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: '用户名或密码错误' }),
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: '服务器错误: ' + e.message }),
    };
  }
};
