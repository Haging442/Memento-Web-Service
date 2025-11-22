const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Data file path
const dataPath = path.join(__dirname, 'data', 'trusted-contacts.json');

// Ensure data directory exists
const dataDir = path.dirname(dataPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({}));
}

// Helper function to read data
function readTrustedContacts() {
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Helper function to write data
function writeTrustedContacts(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET: Display trusted contacts page
router.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    const allContacts = readTrustedContacts();
    const userContacts = allContacts[req.session.userId] || [];
    
    res.render('trusted-contacts', {
        title: '신뢰 연락처 관리',
        contacts: userContacts,
        user: req.session.user
    });
});

// POST: Add new trusted contact
router.post('/add', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    const { name, relationship, email, phone } = req.body;
    
    // Validation
    if (!name || !relationship || !email || !phone) {
        return res.status(400).json({ 
            success: false, 
            message: '모든 필드를 입력해주세요.' 
        });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: '올바른 이메일 형식을 입력해주세요.' 
        });
    }
    
    // Phone validation (basic Korean format)
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
        return res.status(400).json({ 
            success: false, 
            message: '올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)' 
        });
    }
    
    const allContacts = readTrustedContacts();
    if (!allContacts[req.session.userId]) {
        allContacts[req.session.userId] = [];
    }
    
    // Check if maximum contacts reached (limit to 5)
    if (allContacts[req.session.userId].length >= 5) {
        return res.status(400).json({ 
            success: false, 
            message: '신뢰 연락처는 최대 5명까지만 등록할 수 있습니다.' 
        });
    }
    
    // Check for duplicate email
    const existingContact = allContacts[req.session.userId].find(contact => contact.email === email);
    if (existingContact) {
        return res.status(400).json({ 
            success: false, 
            message: '이미 등록된 이메일입니다.' 
        });
    }
    
    const newContact = {
        id: Date.now().toString(),
        name: name.trim(),
        relationship: relationship.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        createdAt: new Date().toISOString()
    };
    
    allContacts[req.session.userId].push(newContact);
    writeTrustedContacts(allContacts);
    
    res.json({ 
        success: true, 
        message: '신뢰 연락처가 성공적으로 등록되었습니다.',
        contact: newContact
    });
});

// PUT: Update trusted contact
router.put('/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    const { id } = req.params;
    const { name, relationship, email, phone } = req.body;
    
    // Validation
    if (!name || !relationship || !email || !phone) {
        return res.status(400).json({ 
            success: false, 
            message: '모든 필드를 입력해주세요.' 
        });
    }
    
    const allContacts = readTrustedContacts();
    const userContacts = allContacts[req.session.userId] || [];
    const contactIndex = userContacts.findIndex(contact => contact.id === id);
    
    if (contactIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: '신뢰 연락처를 찾을 수 없습니다.' 
        });
    }
    
    // Check for duplicate email (excluding current contact)
    const duplicateContact = userContacts.find(contact => 
        contact.email === email.toLowerCase() && contact.id !== id
    );
    if (duplicateContact) {
        return res.status(400).json({ 
            success: false, 
            message: '이미 등록된 이메일입니다.' 
        });
    }
    
    userContacts[contactIndex] = {
        ...userContacts[contactIndex],
        name: name.trim(),
        relationship: relationship.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString()
    };
    
    allContacts[req.session.userId] = userContacts;
    writeTrustedContacts(allContacts);
    
    res.json({ 
        success: true, 
        message: '신뢰 연락처가 성공적으로 수정되었습니다.',
        contact: userContacts[contactIndex]
    });
});

// DELETE: Remove trusted contact
router.delete('/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    const { id } = req.params;
    const allContacts = readTrustedContacts();
    const userContacts = allContacts[req.session.userId] || [];
    const contactIndex = userContacts.findIndex(contact => contact.id === id);
    
    if (contactIndex === -1) {
        return res.status(404).json({ 
            success: false, 
            message: '신뢰 연락처를 찾을 수 없습니다.' 
        });
    }
    
    userContacts.splice(contactIndex, 1);
    allContacts[req.session.userId] = userContacts;
    writeTrustedContacts(allContacts);
    
    res.json({ 
        success: true, 
        message: '신뢰 연락처가 성공적으로 삭제되었습니다.' 
    });
});

// GET: Get trusted contacts for verification (used by death verification system)
router.get('/api/contacts/:userId', (req, res) => {
    // This endpoint should be protected and only accessible by admin or verification system
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }
    
    const { userId } = req.params;
    const allContacts = readTrustedContacts();
    const userContacts = allContacts[userId] || [];
    
    res.json({ 
        success: true, 
        contacts: userContacts 
    });
});

module.exports = router;
