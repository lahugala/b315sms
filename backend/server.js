const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Setup server-side data persistence folder
const DATA_DIR = path.join(__dirname, 'data');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const PHONEBOOK_FILE = path.join(DATA_DIR, 'phonebook.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initJsonFile = (filePath, defaultData) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
};

initJsonFile(GROUPS_FILE, ['General', 'Work', 'Family']);
initJsonFile(PHONEBOOK_FILE, [
    { key: '1', name: 'John Doe', phone: '0771234567', group: 'Work' },
    { key: '2', name: 'Jane Smith', phone: '0719876543', group: 'Family' }
]);
initJsonFile(HISTORY_FILE, []);
initJsonFile(CONFIG_FILE, {
    routerIp: '192.168.8.1',
    username: 'admin',
    password: ''
});

// Config REST routes
app.get('/api/config', (req, res) => {
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

app.post('/api/config', (req, res) => {
    try {
        const { routerIp, username, password } = req.body;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ routerIp, username, password }, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Groups REST routes
app.get('/api/groups', (req, res) => {
    try {
        const data = fs.readFileSync(GROUPS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load groups database' });
    }
});

app.post('/api/groups', (req, res) => {
    try {
        const { groups } = req.body;
        fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save groups database' });
    }
});

// Phonebook REST routes
app.get('/api/phonebook', (req, res) => {
    try {
        const data = fs.readFileSync(PHONEBOOK_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load phonebook database' });
    }
});

app.post('/api/phonebook', (req, res) => {
    try {
        const { phonebook } = req.body;
        fs.writeFileSync(PHONEBOOK_FILE, JSON.stringify(phonebook, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save phonebook database' });
    }
});

// Message History REST routes
app.get('/api/history', (req, res) => {
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load message history database' });
    }
});

app.post('/api/history', (req, res) => {
    try {
        const { history } = req.body;
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save message history database' });
    }
});


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

app.post('/api/received-sms', async (req, res) => {
    const { routerIp, username, password, page = 1, count = 50 } = req.body;
    const baseUrl = `http://${routerIp || '192.168.8.1'}`;
    const crypto = require('crypto');

    try {
        function b64Sha256(str) {
            const hexHash = crypto.createHash('sha256').update(str).digest('hex');
            return Buffer.from(hexHash).toString('base64');
        }

        // 1. Get Session & Token
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

        // 3. Update cookies/tokens
        if (loginRes.headers['__requestverificationtokenone']) {
            tokInfo = loginRes.headers['__requestverificationtokenone'];
        } else if (loginRes.headers['__requestverificationtoken']) {
            tokInfo = loginRes.headers['__requestverificationtoken'];
        }
        
        if (loginRes.headers['set-cookie']) {
            sessionInfo = loginRes.headers['set-cookie'][0].split(';')[0];
        }

        // 4. Fetch SMS List (Inbox is BoxType = 1)
        const smsListXml = `<?xml version="1.0" encoding="UTF-8"?><request><PageIndex>${page}</PageIndex><ReadCount>${count}</ReadCount><BoxType>1</BoxType><SortType>0</SortType><Ascending>0</Ascending><UnreadPreferred>1</UnreadPreferred></request>`;

        const smsListRes = await axios.post(`${baseUrl}/api/sms/sms-list`, smsListXml, {
            headers: {
                'Content-Type': 'text/xml',
                'Cookie': sessionInfo,
                '__RequestVerificationToken': tokInfo
            }
        });

        const smsListData = parser.parse(smsListRes.data);
        
        let routerMessages = [];
        if (smsListData.response && smsListData.response.Messages) {
            const msgNode = smsListData.response.Messages.Message;
            if (msgNode) {
                routerMessages = Array.isArray(msgNode) ? msgNode : [msgNode];
            }
        } else if (smsListData.error) {
            return res.status(500).json({ error: 'Failed to retrieve SMS list from router', details: smsListData.error });
        }

        // 5. Load persisted inbox from file
        const inboxFile = path.join(DATA_DIR, 'inbox.json');
        let storedInbox = [];
        if (fs.existsSync(inboxFile)) {
            try {
                storedInbox = JSON.parse(fs.readFileSync(inboxFile, 'utf8'));
            } catch (err) {
                console.error('Failed to read inbox.json:', err);
            }
        }

        // 6. Merge routerMessages into storedInbox
        let updated = false;
        routerMessages.forEach(msg => {
            // Generate SHA-256 hash from Phone, Date, and Content
            const hashKey = crypto.createHash('sha256').update(`${msg.Phone || ''}_${msg.Date || ''}_${msg.Content || ''}`).digest('hex');
            
            const exists = storedInbox.some(m => m.key === hashKey);
            if (!exists) {
                storedInbox.push({
                    key: hashKey,
                    Index: msg.Index,
                    Phone: msg.Phone,
                    Content: msg.Content,
                    Date: msg.Date,
                    SmsType: msg.SmsType
                });
                updated = true;
            } else {
                // If it already exists, update its Index in case router assigned a new slot index
                const idx = storedInbox.findIndex(m => m.key === hashKey);
                if (idx !== -1 && storedInbox[idx].Index !== msg.Index) {
                    storedInbox[idx].Index = msg.Index;
                    updated = true;
                }
            }
        });

        // Sort storedInbox by Date descending
        storedInbox.sort((a, b) => new Date(b.Date) - new Date(a.Date));

        if (updated) {
            fs.writeFileSync(inboxFile, JSON.stringify(storedInbox, null, 2), 'utf8');
        }

        res.json({ success: true, messagesCount: storedInbox.length, messages: storedInbox });

    } catch (error) {
        console.error('Error fetching received SMS:', error.message);
        res.status(500).json({ error: 'Failed to fetch received SMS', details: error.message });
    }
});

// GET persisted offline inbox
app.get('/api/inbox', (req, res) => {
    const inboxFile = path.join(DATA_DIR, 'inbox.json');
    let storedInbox = [];
    if (fs.existsSync(inboxFile)) {
        try {
            storedInbox = JSON.parse(fs.readFileSync(inboxFile, 'utf8'));
        } catch (err) {
            console.error('Failed to read inbox.json:', err);
        }
    }
    res.json(storedInbox);
});

// Delete message from inbox (and optionally from router SIM)
app.post('/api/inbox/delete', async (req, res) => {
    const { key, routerIp, username, password } = req.body;
    const inboxFile = path.join(DATA_DIR, 'inbox.json');
    let storedInbox = [];
    if (fs.existsSync(inboxFile)) {
        try {
            storedInbox = JSON.parse(fs.readFileSync(inboxFile, 'utf8'));
        } catch (err) {
            console.error('Failed to read inbox.json:', err);
        }
    }

    const msgToDelete = storedInbox.find(m => m.key === key);
    if (!msgToDelete) {
        return res.status(404).json({ error: 'Message not found in database.' });
    }

    // Remove from local database
    storedInbox = storedInbox.filter(m => m.key !== key);
    fs.writeFileSync(inboxFile, JSON.stringify(storedInbox, null, 2), 'utf8');

    let routerDeleted = false;
    let routerError = null;

    // If router credentials are provided and message has a valid Index, try deleting from the router
    if (routerIp && username && password && msgToDelete.Index !== undefined) {
        const baseUrl = `http://${routerIp}`;
        const crypto = require('crypto');
        try {
            function b64Sha256(str) {
                const hexHash = crypto.createHash('sha256').update(str).digest('hex');
                return Buffer.from(hexHash).toString('base64');
            }

            // 1. Get Session & Token
            const tokenRes = await axios.get(`${baseUrl}/api/webserver/SesTokInfo`);
            const tokenData = parser.parse(tokenRes.data);
            let sessionInfo = tokenData.response.SesInfo;
            let tokInfo = tokenData.response.TokInfo;

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

            // 3. Update cookies/tokens
            if (loginRes.headers['__requestverificationtokenone']) {
                tokInfo = loginRes.headers['__requestverificationtokenone'];
            } else if (loginRes.headers['__requestverificationtoken']) {
                tokInfo = loginRes.headers['__requestverificationtoken'];
            }
            if (loginRes.headers['set-cookie']) {
                sessionInfo = loginRes.headers['set-cookie'][0].split(';')[0];
            }

            // 4. Send Delete Request to Router
            const deleteXml = `<?xml version="1.0" encoding="UTF-8"?><request><Index>${msgToDelete.Index}</Index></request>`;
            const deleteRes = await axios.post(`${baseUrl}/api/sms/delete-sms`, deleteXml, {
                headers: {
                    'Content-Type': 'text/xml',
                    'Cookie': sessionInfo,
                    '__RequestVerificationToken': tokInfo
                }
            });

            const deleteData = parser.parse(deleteRes.data);
            if (deleteData.response === 'OK') {
                routerDeleted = true;
            } else {
                routerError = deleteData.error || 'Router returned error on delete';
            }
        } catch (err) {
            console.error('Failed to delete SMS from router:', err.message);
            routerError = err.message;
        }
    }

    res.json({
        success: true,
        message: 'Deleted successfully from local storage.',
        routerDeleted,
        routerError
    });
});

// Bulk delete messages from inbox (and optionally from router SIM)
app.post('/api/inbox/bulk-delete', async (req, res) => {
    const { keys, routerIp, username, password } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({ error: 'No keys provided for deletion.' });
    }

    const inboxFile = path.join(DATA_DIR, 'inbox.json');
    let storedInbox = [];
    if (fs.existsSync(inboxFile)) {
        try {
            storedInbox = JSON.parse(fs.readFileSync(inboxFile, 'utf8'));
        } catch (err) {
            console.error('Failed to read inbox.json:', err);
        }
    }

    const msgsToDelete = storedInbox.filter(m => keys.includes(m.key));
    if (msgsToDelete.length === 0) {
        return res.status(404).json({ error: 'No matching messages found in database.' });
    }

    // Remove from local database
    storedInbox = storedInbox.filter(m => !keys.includes(m.key));
    fs.writeFileSync(inboxFile, JSON.stringify(storedInbox, null, 2), 'utf8');

    let routerDeletedCount = 0;
    let routerErrors = [];

    // If router credentials are provided, delete each message that has a valid Index from router SIM card
    if (routerIp && username && password) {
        const baseUrl = `http://${routerIp}`;
        const crypto = require('crypto');
        try {
            function b64Sha256(str) {
                const hexHash = crypto.createHash('sha256').update(str).digest('hex');
                return Buffer.from(hexHash).toString('base64');
            }

            // 1. Get Session & Token
            const tokenRes = await axios.get(`${baseUrl}/api/webserver/SesTokInfo`);
            const tokenData = parser.parse(tokenRes.data);
            let sessionInfo = tokenData.response.SesInfo;
            let tokInfo = tokenData.response.TokInfo;

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

            // 3. Update cookies/tokens
            if (loginRes.headers['__requestverificationtokenone']) {
                tokInfo = loginRes.headers['__requestverificationtokenone'];
            } else if (loginRes.headers['__requestverificationtoken']) {
                tokInfo = loginRes.headers['__requestverificationtoken'];
            }
            if (loginRes.headers['set-cookie']) {
                sessionInfo = loginRes.headers['set-cookie'][0].split(';')[0];
            }

            // 4. Delete each message index from router
            for (const msg of msgsToDelete) {
                if (msg.Index !== undefined) {
                    try {
                        const deleteXml = `<?xml version="1.0" encoding="UTF-8"?><request><Index>${msg.Index}</Index></request>`;
                        const deleteRes = await axios.post(`${baseUrl}/api/sms/delete-sms`, deleteXml, {
                            headers: {
                                'Content-Type': 'text/xml',
                                'Cookie': sessionInfo,
                                '__RequestVerificationToken': tokInfo
                            }
                        });
                        const deleteData = parser.parse(deleteRes.data);
                        if (deleteData.response === 'OK') {
                            routerDeletedCount++;
                        } else {
                            routerErrors.push(`Index ${msg.Index}: ${deleteData.error || 'Router returned error'}`);
                        }
                    } catch (err) {
                        routerErrors.push(`Index ${msg.Index}: ${err.message}`);
                    }
                }
            }
        } catch (err) {
            console.error('Failed router authentication for bulk delete:', err.message);
            routerErrors.push(`Auth failure: ${err.message}`);
        }
    }

    res.json({
        success: true,
        message: `Successfully deleted ${msgsToDelete.length} messages from local storage.`,
        routerDeletedCount,
        routerErrors
    });
});

app.listen(port, () => {
    console.log(`Backend proxy listening on port ${port}`);
});

