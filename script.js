// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// CTA Button functionality
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('click', function() {
        document.querySelector('#appointments').scrollIntoView({ behavior: 'smooth' });
    });
}

// Form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// Hamburger menu functionality
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', function() {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        this.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        if (navMenu && window.innerWidth <= 480) {
            navMenu.style.display = 'none';
            if (hamburger) hamburger.classList.remove('active');
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe service cards and other elements
document.querySelectorAll('.service-card, .testimonial-card, .info-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Signature Pad functionality
let signaturePad;

function initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (canvas) {
        signaturePad = new SignaturePad(canvas);
        
        // Set canvas size to fill its container
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = 150 * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
    }
}

function clearSignature() {
    if (signaturePad) {
        signaturePad.clear();
    }
}

function getFormData() {
    const clientName = document.getElementById('clientName').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const signDate = document.getElementById('signDate').value;
    
    if (!clientName || !clientEmail || !signDate) {
        alert('Please fill in all required fields (Name, Email, Date).');
        return null;
    }
    
    if (!signaturePad || signaturePad.isEmpty()) {
        alert('Please provide a signature before submitting.');
        return null;
    }
    
    return {
        clientName,
        clientEmail,
        signDate,
        signatureDataUrl: signaturePad.toDataURL('image/png')
    };
}

function generatePDF(formData) {
    const element = document.getElementById('consentForm');
    const consent = document.querySelector('.form-content').parentElement;
    
    const pdf = new html2pdf();
    const options = {
        margin: 10,
        filename: `Consent_Form_${formData.clientName.replace(/\s+/g, '_')}_${formData.signDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    const htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: #2d5a3d; margin-bottom: 20px; }
                    p { margin-bottom: 12px; line-height: 1.6; text-align: justify; }
                    .signature-section { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
                    .signature-image { max-width: 200px; margin: 10px 0; border: 1px solid #999; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; }
                    strong { color: #2d5a3d; }
                </style>
            </head>
            <body>
                <h2>Informed Consent to Registered Massage Therapy</h2>
                <div class="form-content">
                    ${document.querySelector('.form-content').innerHTML}
                </div>
                <div class="signature-section">
                    <div class="field">
                        <span class="label">CLIENT NAME:</span> ${formData.clientName}
                    </div>
                    <div class="field">
                        <span class="label">CLIENT EMAIL:</span> ${formData.clientEmail}
                    </div>
                    <div class="field">
                        <span class="label">SIGNATURE:</span><br/>
                        <img src="${formData.signatureDataUrl}" class="signature-image" alt="Client Signature"/>
                    </div>
                    <div class="field">
                        <span class="label">DATE:</span> ${formData.signDate}
                    </div>
                </div>
            </body>
        </html>
    `;
    
    pdf.setOptions(options);
    return pdf.html(htmlContent).output('blob');
}

async function submitToGoogleDrive() {
    const formData = getFormData();
    if (!formData) return;
    
    const statusDiv = document.getElementById('submissionStatus');
    statusDiv.style.display = 'block';
    statusDiv.className = 'submission-status loading';
    statusDiv.innerHTML = '<p>⏳ Generating PDF and uploading to Google Drive...</p>';
    
    try {
        const pdfBlob = generatePDF(formData);
        const formDataToSend = new FormData();
        formDataToSend.append('fileName', `Consent_Form_${formData.clientName.replace(/\s+/g, '_')}_${formData.signDate}.pdf`);
        formDataToSend.append('clientName', formData.clientName);
        formDataToSend.append('clientEmail', formData.clientEmail);
        formDataToSend.append('file', pdfBlob, 'consent_form.pdf');
        
        // Replace with your Google Apps Script deployment URL
        const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_URL';
        
        if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_URL') {
            statusDiv.className = 'submission-status error';
            statusDiv.innerHTML = '<p>❌ Google Drive upload not configured. Please use "Send via Email" option instead.</p>';
            return;
        }
        
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formDataToSend
        });
        
        if (response.ok) {
            statusDiv.className = 'submission-status success';
            statusDiv.innerHTML = '<p>✓ Form successfully uploaded to Google Drive! You will receive a confirmation email.</p>';
            setTimeout(() => {
                document.getElementById('consentForm').reset();
                signaturePad.clear();
                statusDiv.style.display = 'none';
            }, 3000);
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        statusDiv.className = 'submission-status error';
        statusDiv.innerHTML = '<p>❌ Error uploading to Google Drive. Please try sending via email instead.</p>';
        console.error('Google Drive upload error:', error);
    }
}

async function submitViaEmail() {
    const formData = getFormData();
    if (!formData) return;
    
    const statusDiv = document.getElementById('submissionStatus');
    statusDiv.style.display = 'block';
    statusDiv.className = 'submission-status loading';
    statusDiv.innerHTML = '<p>⏳ Generating PDF and sending email...</p>';
    
    try {
        // Initialize EmailJS (replace with your EmailJS service ID)
        emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
        
        const pdfBlob = generatePDF(formData);
        const reader = new FileReader();
        
        reader.onload = async function() {
            const pdfBase64 = reader.result.split(',')[1];
            
            const templateParams = {
                to_email: formData.clientEmail,
                from_name: 'ErinGlen Wellness',
                client_name: formData.clientName,
                client_email: formData.clientEmail,
                sign_date: formData.signDate,
                pdf_attachment: pdfBase64,
                massage_email: 'eringlenrmt@gmail.com'
            };
            
            try {
                const response = await emailjs.send(
                    'YOUR_EMAILJS_SERVICE_ID',
                    'YOUR_EMAILJS_TEMPLATE_ID',
                    templateParams
                );
                
                if (response.status === 200) {
                    statusDiv.className = 'submission-status success';
                    statusDiv.innerHTML = '<p>✓ Form successfully sent via email! Check your inbox for the PDF.</p>';
                    setTimeout(() => {
                        document.getElementById('consentForm').reset();
                        signaturePad.clear();
                        statusDiv.style.display = 'none';
                    }, 3000);
                }
            } catch (emailError) {
                statusDiv.className = 'submission-status error';
                statusDiv.innerHTML = '<p>❌ Error sending email. Please try downloading the PDF instead.</p>';
                console.error('Email error:', emailError);
            }
        };
        
        reader.readAsDataURL(pdfBlob);
    } catch (error) {
        statusDiv.className = 'submission-status error';
        statusDiv.innerHTML = '<p>❌ Error processing form. Please try again.</p>';
        console.error('Form processing error:', error);
    }
}

function downloadPDF() {
    const formData = getFormData();
    if (!formData) return;
    
    const statusDiv = document.getElementById('submissionStatus');
    statusDiv.style.display = 'block';
    statusDiv.className = 'submission-status loading';
    statusDiv.innerHTML = '<p>⏳ Generating PDF...</p>';
    
    try {
        const pdfBlob = generatePDF(formData);
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Consent_Form_${formData.clientName.replace(/\s+/g, '_')}_${formData.signDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        statusDiv.className = 'submission-status success';
        statusDiv.innerHTML = '<p>✓ PDF downloaded successfully!</p>';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 2000);
    } catch (error) {
        statusDiv.className = 'submission-status error';
        statusDiv.innerHTML = '<p>❌ Error generating PDF. Please try again.</p>';
        console.error('PDF generation error:', error);
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
}

// Initialize signature pad when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initSignaturePad();
});
