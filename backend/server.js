const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const parser = new XMLParser();
const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true
});

app.post('/api/send-sms', async (req, res) => {
    const { routerIp, username, password, phone, content } = req.body;
    const baseUrl = `http://${routerIp || '192.168.8.1'}`;

    try {
        const crypto = require('crypto');
        function b64Sha256(str) {
            const hexHash = crypto.createHash('sha256').update(str).digest('hex');
            return Buffer.from(hexHash).toString('base64');
        }

        // 1. Get initial Session and Token Info
        const tokenRes = await axios.get(`${baseUrl}/api/webserver/SesTokInfo`);
        const tokenData = parser.parse(tokenRes.data);
        
        let sessionInfo = tokenData.response.SesInfo;
        let tokInfo = tokenData.response.TokInfo;

        if (!sessionInfo || !tokInfo) {
            return res.status(500).json({ error: 'Failed to retrieve initial session/token info' });
        }

        // 2. Perform Login
        const p1 = b64Sha256(password);
        const p2 = b64Sha256(username + p1 + tokInfo);

        const loginXml = `<?xml version="1.0" encoding="UTF-8"?><request><Username>${username}</Username><Password>${p2}</Password><password_type>4</password_type></request>`;

        const loginRes = await axios.post(`${baseUrl}/api/user/login`, loginXml, {
            headers: {
                'Content-Type': 'text/xml',
                'Cookie': sessionInfo,
                '__RequestVerificationToken': tokInfo
            }
        });

        const loginData = parser.parse(loginRes.data);
        if (loginData.error) {
            return res.status(401).json({ error: 'Login failed', details: loginData.error });
        }

        // 3. Update tokens from login response headers
        if (loginRes.headers['__requestverificationtokenone']) {
            tokInfo = loginRes.headers['__requestverificationtokenone'];
        } else if (loginRes.headers['__requestverificationtoken']) {
            tokInfo = loginRes.headers['__requestverificationtoken'];
        }
        
        if (loginRes.headers['set-cookie']) {
            sessionInfo = loginRes.headers['set-cookie'][0].split(';')[0];
        }

        // 4. Prepare SMS XML Payload
        const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?><request><Index>-1</Index><Phones><Phone>${phone}</Phone></Phones><Sca></Sca><Content>${content}</Content><Length>${content.length}</Length><Reserved>1</Reserved><Date>${dateStr}</Date></request>`;

        // 5. Send SMS
        const sendRes = await axios.post(`${baseUrl}/api/sms/send-sms`, xmlPayload, {
            headers: {
                'Content-Type': 'text/xml',
                'Cookie': sessionInfo,
                '__RequestVerificationToken': tokInfo
            }
        });

        const sendData = parser.parse(sendRes.data);
        
        if (sendData.response === 'OK') {
            res.json({ success: true, message: 'SMS sent successfully!' });
        } else {
            res.status(500).json({ error: 'Failed to send SMS', details: sendData.error });
        }

    } catch (error) {
        console.error('Error communicating with router:', error.message);
        res.status(500).json({ error: 'Router communication failed', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend proxy listening on port ${port}`);
});
