// PDF OCR service for death certificate processing
const fs = require('fs');
const path = require('path');

// For OCR, we'll use tesseract.js (JavaScript OCR library)
// Install: npm install tesseract.js pdf-poppler

let Tesseract, pdfPoppler;

// Lazy load dependencies (install only when needed)
const loadDependencies = async () => {
    try {
        if (!Tesseract) {
            Tesseract = require('tesseract.js');
        }
        if (!pdfPoppler) {
            pdfPoppler = require('pdf-poppler');
        }
        return true;
    } catch (error) {
        console.log('⚠️  OCR dependencies not installed. Run: npm install tesseract.js pdf-poppler');
        return false;
    }
};

// Extract text from PDF using OCR
async function extractTextFromPDF(pdfPath) {
    const depsLoaded = await loadDependencies();
    
    if (!depsLoaded) {
        // Fallback: return simulated OCR result
        return {
            success: false,
            simulated: true,
            text: "시뮬레이션 OCR 결과: 사망확인서 텍스트 추출 기능이 활성화되지 않았습니다.",
            extractedInfo: {
                name: "추출된 이름 없음",
                idNumber: "추출된 주민번호 없음",
                deathDate: "추출된 사망일자 없음"
            }
        };
    }

    try {
        // Step 1: Convert PDF to images
        const outputDir = path.dirname(pdfPath);
        const pdfName = path.basename(pdfPath, '.pdf');
        const imageOutputPath = path.join(outputDir, `${pdfName}_page`);

        console.log('📄 Converting PDF to images...');
        const options = {
            format: 'jpeg',
            out_dir: outputDir,
            out_prefix: `${pdfName}_page`,
            page: 1 // Only process first page
        };

        const pdfImagePath = await pdfPoppler.convert(pdfPath, options);
        const imagePath = `${imageOutputPath}-1.jpg`;

        // Step 2: Perform OCR on the image
        console.log('🔍 Performing OCR on death certificate...');
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'kor+eng', // Korean + English
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        process.stdout.write(`\rOCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        console.log('\n✅ OCR completed successfully!');

        // Step 3: Extract specific information using regex
        const extractedInfo = extractDeathCertificateInfo(text);

        // Step 4: Clean up temporary image file
        try {
            fs.unlinkSync(imagePath);
        } catch (cleanupError) {
            console.warn('Warning: Could not delete temporary image file');
        }

        return {
            success: true,
            simulated: false,
            text: text,
            extractedInfo: extractedInfo
        };

    } catch (error) {
        console.error('❌ OCR processing failed:', error.message);
        
        // Return simulated result on error
        return {
            success: false,
            simulated: true,
            error: error.message,
            text: "OCR 처리 중 오류가 발생했습니다.",
            extractedInfo: {
                name: "추출 실패",
                idNumber: "추출 실패",
                deathDate: "추출 실패"
            }
        };
    }
}

// Extract specific information from OCR text
function extractDeathCertificateInfo(text) {
    const info = {
        name: null,
        idNumber: null,
        deathDate: null,
        birthDate: null,
        confidence: 'low'
    };

    // Korean patterns for death certificate
    const patterns = {
        // Name patterns (한국 이름)
        name: [
            /성명[:\s]*([가-힣]{2,4})/i,
            /이름[:\s]*([가-힣]{2,4})/i,
            /성[:\s]*([가-힣]{2,4})/i
        ],
        
        // ID number patterns (주민등록번호)
        idNumber: [
            /([0-9]{6}[-\s]*[0-9]{7})/g,
            /주민등록번호[:\s]*([0-9]{6}[-\s]*[0-9]{7})/i,
            /등록번호[:\s]*([0-9]{6}[-\s]*[0-9]{7})/i
        ],
        
        // Death date patterns (사망일자)
        deathDate: [
            /사망일시[:\s]*([0-9]{4}[년.\-\/\s]*[0-9]{1,2}[월.\-\/\s]*[0-9]{1,2}[일]?)/i,
            /사망일[:\s]*([0-9]{4}[년.\-\/\s]*[0-9]{1,2}[월.\-\/\s]*[0-9]{1,2}[일]?)/i,
            /([0-9]{4}[년.\-\/\s]*[0-9]{1,2}[월.\-\/\s]*[0-9]{1,2}[일]?)[^\d]*사망/i
        ],
        
        // Birth date patterns (생년월일)
        birthDate: [
            /생년월일[:\s]*([0-9]{4}[년.\-\/\s]*[0-9]{1,2}[월.\-\/\s]*[0-9]{1,2}[일]?)/i,
            /출생[:\s]*([0-9]{4}[년.\-\/\s]*[0-9]{1,2}[월.\-\/\s]*[0-9]{1,2}[일]?)/i
        ]
    };

    // Extract name
    for (const pattern of patterns.name) {
        const match = text.match(pattern);
        if (match && match[1]) {
            info.name = match[1].trim();
            break;
        }
    }

    // Extract ID number
    for (const pattern of patterns.idNumber) {
        const match = text.match(pattern);
        if (match && match[1]) {
            info.idNumber = match[1].replace(/[-\s]/g, '');
            break;
        }
    }

    // Extract death date
    for (const pattern of patterns.deathDate) {
        const match = text.match(pattern);
        if (match && match[1]) {
            info.deathDate = match[1].trim();
            break;
        }
    }

    // Extract birth date
    for (const pattern of patterns.birthDate) {
        const match = text.match(pattern);
        if (match && match[1]) {
            info.birthDate = match[1].trim();
            break;
        }
    }

    // Calculate confidence based on extracted fields
    const extractedFields = Object.values(info).filter(v => v !== null && v !== 'low').length;
    if (extractedFields >= 3) {
        info.confidence = 'high';
    } else if (extractedFields >= 2) {
        info.confidence = 'medium';
    }

    return info;
}

// Verify extracted information against user database
function verifyExtractedInfo(extractedInfo, reportedName, reportedId) {
    const verification = {
        nameMatch: false,
        idMatch: false,
        overall: false,
        confidence: 'low'
    };

    // Verify name
    if (extractedInfo.name && reportedName) {
        verification.nameMatch = extractedInfo.name === reportedName;
    }

    // Verify ID (check if extracted ID starts with reported partial ID)
    if (extractedInfo.idNumber && reportedId) {
        const cleanReportedId = reportedId.replace(/[^0-9]/g, '');
        verification.idMatch = extractedInfo.idNumber.startsWith(cleanReportedId);
    }

    // Overall verification
    verification.overall = verification.nameMatch && verification.idMatch;
    
    if (verification.overall) {
        verification.confidence = 'high';
    } else if (verification.nameMatch || verification.idMatch) {
        verification.confidence = 'medium';
    }

    return verification;
}

// Main function to process death certificate
async function processDeathCertificate(filePath, reportedName, reportedId) {
    console.log('📋 Processing death certificate...');
    
    // Extract text using OCR
    const ocrResult = await extractTextFromPDF(filePath);
    
    if (!ocrResult.success) {
        return {
            success: false,
            message: 'OCR 처리에 실패했습니다.',
            ocrResult: ocrResult
        };
    }

    // Verify extracted information
    const verification = verifyExtractedInfo(ocrResult.extractedInfo, reportedName, reportedId);

    console.log('📊 OCR Results:');
    console.log('- Extracted Name:', ocrResult.extractedInfo.name || 'Not found');
    console.log('- Extracted ID:', ocrResult.extractedInfo.idNumber || 'Not found');
    console.log('- Death Date:', ocrResult.extractedInfo.deathDate || 'Not found');
    console.log('- Name Verification:', verification.nameMatch ? '✅' : '❌');
    console.log('- ID Verification:', verification.idMatch ? '✅' : '❌');
    console.log('- Overall Confidence:', verification.confidence);

    return {
        success: true,
        message: 'OCR 처리가 완료되었습니다.',
        ocrResult: ocrResult,
        verification: verification,
        extractedInfo: ocrResult.extractedInfo
    };
}

module.exports = {
    extractTextFromPDF,
    processDeathCertificate,
    verifyExtractedInfo,
    extractDeathCertificateInfo
};
