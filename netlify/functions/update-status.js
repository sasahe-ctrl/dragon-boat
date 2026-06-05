const NOTION_TOKEN = process.env.NOTION_TOKEN;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
  }

  try {
    // 从路径拿 id：/api/update-status/{id}
    const pageId = event.path.split('/').pop();
    const { status } = JSON.parse(event.body);

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: '无效状态' }) };
    }

    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          '状态': { select: { name: status } },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: err.message }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: e.message }) };
  }
};
