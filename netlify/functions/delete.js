const NOTION_TOKEN = process.env.NOTION_TOKEN;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
  }

  try {
    // 从路径拿 id：/api/delete/{id}
    const pageId = event.path.split('/').pop();

    // Notion 不能真正删除，用归档代替
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archived: true }),
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
