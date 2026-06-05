const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = '376b7c278a80802f8073e99620bf29ab';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

  try {
    // 拉取所有记录
    let all = [];
    let cursor = undefined;
    do {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      all = all.concat(data.results || []);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    const today = new Date().toISOString().slice(0, 10);
    let todayCount = 0;
    const statuses = {};

    for (const r of all) {
      const created = r.created_time?.slice(0, 10);
      if (created === today) todayCount++;
      const status = r.properties['状态']?.select?.name || 'pending';
      statuses[status] = (statuses[status] || 0) + 1;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          total: all.length,
          today: todayCount,
          statuses,
        },
      }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: e.message }) };
  }
};
