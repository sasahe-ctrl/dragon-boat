const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = '376b7c278a808060be37e250054c7aa5';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function getProp(page, key, type) {
  const prop = page.properties[key];
  if (!prop) return '';
  if (type === 'title') return prop.title?.[0]?.plain_text || '';
  if (type === 'rich_text') return prop.rich_text?.[0]?.plain_text || '';
  if (type === 'email') return prop.email || '';
  if (type === 'select') return prop.select?.name || '';
  return '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

  try {
    const params = event.queryStringParameters || {};
    const search = (params.search || '').toLowerCase();
    const statusFilter = params.status || '';
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');

    // 拉取所有记录
    let all = [];
    let cursor = undefined;
    do {
      const body = { page_size: 100, sorts: [{ timestamp: 'created_time', direction: 'descending' }] };
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

    // 转换格式
    let records = all.map(r => ({
      id: r.id,
      name: getProp(r, '姓名', 'title'),
      phone: getProp(r, '手机号', 'rich_text'),
      email: getProp(r, '邮箱', 'email'),
      age: getProp(r, '年龄', 'rich_text'),
      gender: getProp(r, '性别', 'select'),
      level: getProp(r, '水平', 'rich_text'),
      remarks: getProp(r, '备注', 'rich_text'),
      status: getProp(r, '状态', 'select') || 'pending',
      created_at: r.created_time,
    }));

    // 搜索过滤
    if (search) {
      records = records.filter(r =>
        r.name.toLowerCase().includes(search) ||
        r.phone.includes(search) ||
        r.email.toLowerCase().includes(search)
      );
    }

    // 状态过滤
    if (statusFilter) {
      records = records.filter(r => r.status === statusFilter);
    }

    const total = records.length;
    const totalPages = Math.ceil(total / limit);
    const data = records.slice((page - 1) * limit, page * limit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
        pagination: { total, totalPages, currentPage: page, limit },
      }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: e.message }) };
  }
};
