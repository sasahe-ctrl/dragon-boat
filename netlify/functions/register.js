const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.NETLIFY ? '/tmp/registrations.json' : path.join(__dirname, '../../data/registrations.json');

function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
}

function readData() {
    initDataFile();
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: '只支持 POST' }) };
    }

    try {
        const { name, email, phone, age, gender, session, level, remarks } = JSON.parse(event.body);

        if (!name || !phone || !session) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: '请填写姓名、手机号、场次' })
            };
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: '手机号格式不正确' })
            };
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: '邮箱格式不正确' })
            };
        }

        const registrations = readData();
        const duplicate = registrations.find(r => r.phone === phone || (email && r.email === email));
        if (duplicate) {
            return {
                statusCode: 409,
                body: JSON.stringify({ success: false, message: '该手机号或邮箱已报名' })
            };
        }

        const newReg = {
            id: Date.now().toString(),
            name: name.trim(),
            email: (email || '').trim().toLowerCase(),
            phone: phone.trim(),
            age: age || '',
            gender: gender || '',
            session,
            level: level || '',
            remarks: remarks ? remarks.trim() : '',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        registrations.push(newReg);
        writeData(registrations);

        return {
            statusCode: 201,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, message: '报名成功！端午安康！🐲' })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: '服务器错误' }) };
    }
};