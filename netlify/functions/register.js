const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = '376b7c278a80802f8073e99620bf29ab';

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
    const { name, email, phone, age, gender, session, level, remarks } = JSON.parse(event.body);

    // 必填校验
    if (!name || !phone || !session) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: '请填写姓名、手机号和参加场次' }),
      };
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: '手机号格式不正确' }),
      };
    }

    // 重复检查：查询 Notion 是否已有相同手机号
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: '手机号',
          rich_text: { equals: phone.trim() },
        },
      }),
    });

    const queryData = await queryRes.json();
    if (queryData.results && queryData.results.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ success: false, message: '该手机号已报名，请勿重复提交' }),
      };
    }

    // 写入 Notion
    const createRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          '姓名': {
            title: [{ text: { content: name.trim() } }],
          },
          '手机号': {
            rich_text: [{ text: { content: phone.trim() } }],
          },
          '邮箱': {
            email: email ? email.trim().toLowerCase() : null,
          },
          '年龄': {
            rich_text: [{ text: { content: age ? String(age) : '' } }],
          },
          '性别': {
            select: gender ? { name: gender } : null,
          },
          '场次': {
            rich_text: [{ text: { content: session || '' } }],
          },
          '水平': {
            rich_text: [{ text: { content: level || '' } }],
          },
          '备注': {
            rich_text: [{ text: { content: remarks ? remarks.trim() : '' } }],
          },
          '状态': {
            select: { name: 'pending' },
          },
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      console.error('Notion error:', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: '写入失败，请稍后再试' }),
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, message: '已收到您的报名！会所人员将与您联系确认。' }),
    };
  } catch (e) {
    console.error('handler error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: '服务器错误: ' + e.message }),
    };
  }
};
