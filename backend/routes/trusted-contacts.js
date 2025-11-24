const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Display trusted contacts page
router.get('/', (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/login');
    }
    
    // Get trusted contacts for current user
    db.all(
        `SELECT id, name, relation, email, phone, created_at 
         FROM trusted_contacts 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [req.session.userId],
        (err, contacts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Database error');
            }
            
            res.render('trusted-contacts', {
                title: '신뢰 연락처 관리',
                contacts: contacts || [],
                user: req.session.user
            });
        }
    );
});

// POST: Add new trusted contact
router.post('/add', (req, res) => {
    if (!req.session?.userId) {
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
    
    // Check current count (limit to 5)
    db.get(
        `SELECT COUNT(*) as count FROM trusted_contacts WHERE user_id = ?`,
        [req.session.userId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error' 
                });
            }
            
            if (row.count >= 5) {
                return res.status(400).json({ 
                    success: false, 
                    message: '신뢰 연락처는 최대 5명까지만 등록할 수 있습니다.' 
                });
            }
            
            // Check for duplicate email
            db.get(
                `SELECT id FROM trusted_contacts WHERE user_id = ? AND email = ?`,
                [req.session.userId, email.trim().toLowerCase()],
                (err, existing) => {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Database error' 
                        });
                    }
                    
                    if (existing) {
                        return res.status(400).json({ 
                            success: false, 
                            message: '이미 등록된 이메일입니다.' 
                        });
                    }
                    
                    // Insert new contact
                    db.run(
                        `INSERT INTO trusted_contacts (user_id, name, relation, email, phone) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            req.session.userId,
                            name.trim(),
                            relationship.trim(),
                            email.trim().toLowerCase(),
                            phone.trim()
                        ],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Database error' 
                                });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: '신뢰 연락처가 성공적으로 등록되었습니다.',
                                contact: {
                                    id: this.lastID,
                                    name: name.trim(),
                                    relationship: relationship.trim(),
                                    email: email.trim().toLowerCase(),
                                    phone: phone.trim()
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});

// PUT: Update trusted contact
router.put('/:id', (req, res) => {
    if (!req.session?.userId) {
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
    
    // Check if contact belongs to current user
    db.get(
        `SELECT id FROM trusted_contacts WHERE id = ? AND user_id = ?`,
        [id, req.session.userId],
        (err, contact) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error' 
                });
            }
            
            if (!contact) {
                return res.status(404).json({ 
                    success: false, 
                    message: '신뢰 연락처를 찾을 수 없습니다.' 
                });
            }
            
            // Check for duplicate email (excluding current contact)
            db.get(
                `SELECT id FROM trusted_contacts 
                 WHERE user_id = ? AND email = ? AND id != ?`,
                [req.session.userId, email.toLowerCase(), id],
                (err, duplicate) => {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Database error' 
                        });
                    }
                    
                    if (duplicate) {
                        return res.status(400).json({ 
                            success: false, 
                            message: '이미 등록된 이메일입니다.' 
                        });
                    }
                    
                    // Update contact
                    db.run(
                        `UPDATE trusted_contacts 
                         SET name = ?, relation = ?, email = ?, phone = ? 
                         WHERE id = ? AND user_id = ?`,
                        [
                            name.trim(),
                            relationship.trim(),
                            email.trim().toLowerCase(),
                            phone.trim(),
                            id,
                            req.session.userId
                        ],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Database error' 
                                });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: '신뢰 연락처가 성공적으로 수정되었습니다.',
                                contact: {
                                    id: id,
                                    name: name.trim(),
                                    relationship: relationship.trim(),
                                    email: email.trim().toLowerCase(),
                                    phone: phone.trim()
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});

// DELETE: Remove trusted contact
router.delete('/:id', (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    
    const { id } = req.params;
    
    // Check if contact belongs to current user
    db.get(
        `SELECT id FROM trusted_contacts WHERE id = ? AND user_id = ?`,
        [id, req.session.userId],
        (err, contact) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error' 
                });
            }
            
            if (!contact) {
                return res.status(404).json({ 
                    success: false, 
                    message: '신뢰 연락처를 찾을 수 없습니다.' 
                });
            }
            
            // Delete contact
            db.run(
                `DELETE FROM trusted_contacts WHERE id = ? AND user_id = ?`,
                [id, req.session.userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Database error' 
                        });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: '신뢰 연락처가 성공적으로 삭제되었습니다.' 
                    });
                }
            );
        }
    );
});

// GET: Get trusted contacts for verification (used by death verification system)
router.get('/api/contacts/:userId', (req, res) => {
    // This endpoint should be protected and only accessible by admin or verification system
    if (!req.session?.isAdmin) {
        return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }
    
    const { userId } = req.params;
    
    db.all(
        `SELECT id, name, relation, email, phone 
         FROM trusted_contacts 
         WHERE user_id = ?`,
        [userId],
        (err, contacts) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error' 
                });
            }
            
            res.json({ 
                success: true, 
                contacts: contacts || [] 
            });
        }
    );
});

module.exports = router;
