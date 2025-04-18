const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const validator = require('validator');

console.log("Email configuration:", {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER ? "Set" : "Not set",
    password: process.env.EMAIL_PASSWORD ? "Set" : "Not set"
});

// Creating reusable transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // using SSl
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Register Handlebars helpers
handlebars.registerHelper('if', function(conditional, options) {
    if (conditional) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

// Generating QR code as data URL
async function generateQRCode(data, appointmentId = null) {
    try {
        // If appointmentId is provided, include it in the QR code data
        const qrData = appointmentId
            ? `{"id":"${appointmentId}","password":"${data}"}`
            : data;

        // Generate a larger QR code by specifying width and height
        return await QRCode.toDataURL(qrData, {
            width: 400,
            height: 400,
            margin: 2,
            errorCorrectionLevel: 'H'
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

function loadEmailTemplate(templateName) {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
}

function getBankLogoPath(bankName) {
    const bankLogos = {
        'Acba Bank': 'acba.png',
        'Ameriabank': 'ameriabank.png',
        'AMIO bank': 'amio.png',
        'Araratbank': 'araratbank.png',
        'Ardshinbank': 'ardshinbank.png',
        'Ardshininvestbank': 'ardshinbank.png',
        'Armeconombank': 'armeconombank.jpg',
        'Artsakhbank': 'artsakhbank.png',
        'Byblos Bank Armenia': 'byblos.webp',
        'Converse Bank': 'converse.jpg',
        'Evocabank': 'evocabank.png',
        'Fast Bank': 'fast.jpeg',
        'ID Bank': 'idbank.png',
        'Idram': 'idram.png',
        'Inecobank': 'inecobank.png',
        'VTB Bank (Armenia)': 'vtb.png'
    };

    try {
        const logoFile = bankLogos[bankName] || 'default-bank.png';
        const logoPath = path.join(__dirname, '..', 'public', 'logos', logoFile);

        if (fs.existsSync(logoPath)) {
            return logoPath;
        } else {
            console.warn(`Logo file not found for ${bankName}: ${logoPath}`);
            const defaultPath = path.join(__dirname, '..', 'public', 'logos', 'default-bank.png');
            return fs.existsSync(defaultPath) ? defaultPath : null;
        }
    } catch (error) {
        console.error('Error getting bank logo path:', error);
        return null;
    }
}

async function sendAppointmentConfirmation(appointmentData) {
    try {
        const qrCodeDataUrl = await generateQRCode(appointmentData.password, appointmentData._id);
        const timeSlotString = String(appointmentData.timeSlot); // Convert to string to be saf

        const timeSlotParts = timeSlotString.split('/');

        let formattedDate = "Invalid Date";
        let formattedTime = "Invalid Time";

        if (timeSlotParts.length >= 5) {
            const day = timeSlotParts[0];
            const month = timeSlotParts[1];
            const yearShort = timeSlotParts[2];
            const hour = timeSlotParts[3];
            const minute = timeSlotParts[4];
            formattedTime = `${hour}:${minute}`;

            try {
                const fullYear = 2000 + parseInt(yearShort);
                const dateObj = new Date(fullYear, parseInt(month) - 1, parseInt(day));
                if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    console.warn("Invalid date object created, using basic format");
                    formattedDate = `${day}/${month}/${fullYear}`;
                }
            } catch (error) {
                console.error("Error formatting date:", error);
                formattedDate = `${day}/${month}/20${yearShort}`;
            }
        } else {
            console.error("Invalid timeSlot format, not enough parts:", timeSlotString);
        }
        const logoPath = getBankLogoPath(appointmentData.bankName);
        const attachments = [
            {
                filename: 'appointment-qr.png',
                content: qrCodeDataUrl.split(';base64,').pop(),
                encoding: 'base64',
                cid: 'qr-code'
            }
        ];

        if (logoPath) {
            attachments.push({
                filename: 'bank-logo.png',
                path: logoPath,
                cid: 'bank-logo'
            });
        }

        const templateData = {
            customerName: appointmentData.customerName,
            bankName: appointmentData.bankName,
            branchName: appointmentData.branchName,
            branchAddress: appointmentData.branchAddress || 'Not specified',
            formattedDate: formattedDate,
            formattedTime: formattedTime,
            serviceType: appointmentData.service.type,
            serviceDescription: appointmentData.service.description || appointmentData.service.type,
            entityType: appointmentData.entityType || 'Individual',
            email: appointmentData.email,
            phoneNumber: appointmentData.phoneNumber,
            companyName: appointmentData.companyName,
            password: appointmentData.password,
            qrCodeUrl: qrCodeDataUrl,
            cancelUrl: `http://localhost:8080/manage-appointment/${appointmentData._id}`,
            logoPath: !!logoPath
        };

        const template = loadEmailTemplate('appointment-confirmation');
        const htmlContent = template(templateData);

        const mailOptions = {
            from: `"${appointmentData.bankName} Appointments" <${process.env.EMAIL_USER}>`,
            to: appointmentData.email,
            subject: 'Your Appointment Confirmation',
            html: htmlContent,
            attachments: attachments
        };

        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

async function sendAppointmentReminder(appointmentData) {
    try {
        console.log("Sending reminder for appointment:", appointmentData._id);
        const qrCodeDataUrl = await generateQRCode(appointmentData.password, appointmentData._id);
        const attachments = [
            {
                filename: 'appointment-qr.png',
                content: qrCodeDataUrl.split(';base64,').pop(),
                encoding: 'base64',
                cid: 'qr-code'
            }
        ];
        const timeSlotString = String(appointmentData.timeSlot);
        console.log("Original timeSlot for reminder:", timeSlotString);

        const timeSlotParts = timeSlotString.split('/');
        console.log("Split timeSlot into parts:", timeSlotParts);

        let formattedDate = "Today";
        let formattedTime = "Soon";
        if (timeSlotParts.length >= 5) {
            const day = timeSlotParts[0];
            const month = timeSlotParts[1];
            const yearShort = timeSlotParts[2];
            const hour = timeSlotParts[3];
            const minute = timeSlotParts[4];
            formattedTime = `${hour}:${minute}`;

            try {
                const fullYear = 2000 + parseInt(yearShort);
                const dateObj = new Date(fullYear, parseInt(month) - 1, parseInt(day));
                console.log("Created date object:", dateObj.toString());
                if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    console.log("Successfully formatted date:", formattedDate);
                }
            } catch (error) {
                console.error("Error formatting date for reminder:", error);
            }
        }
        const logoPath = getBankLogoPath(appointmentData.bankName);
        if (logoPath) {
            attachments.push({
                filename: 'bank-logo.png',
                path: logoPath,
                cid: 'bank-logo'
            });
        }

        const templateData = {
            customerName: appointmentData.customerName,
            bankName: appointmentData.bankName,
            branchName: appointmentData.branchName,
            branchAddress: appointmentData.branchAddress || 'Not specified',
            formattedDate: formattedDate,
            formattedTime: formattedTime,
            serviceType: appointmentData.service.type,
            serviceDescription: appointmentData.service.description || appointmentData.service.type,
            entityType: appointmentData.entityType || 'Individual',
            phoneNumber: appointmentData.phoneNumber || '',
            email: appointmentData.email || '',
            qrCodeUrl: qrCodeDataUrl,
            password: appointmentData.password,
            cancelUrl: `http://localhost:8080/manage-appointment/${appointmentData._id}`,
            logoPath: !!logoPath
        };
        console.log('Template Data:', {
            phoneNumber: templateData.phoneNumber,
            email: templateData.email
        });

        const template = loadEmailTemplate('appointment-reminder');
        const htmlContent = template(templateData);
        const mailOptions = {
            from: `"${appointmentData.bankName} Appointments" <${process.env.EMAIL_USER}>`,
            to: appointmentData.email,
            subject: 'Your Appointment Reminder',
            html: htmlContent,
            attachments: attachments
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Reminder email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending reminder email:', error);
        throw error;
    }
}


/**
 * Sending contact form submission email
 * // @param {Object} formData - Contact form data
 * // @returns {Promise<Object>} - Email sending result
 */
async function sendContactFormEmail(formData) {
    try {
        const sanitizedData = {
            fullName: validator.escape(formData.fullName),
            email: validator.escape(formData.email),
            phone: formData.phone ? validator.escape(formData.phone) : 'Not provided',
            message: validator.escape(formData.message).replace(/\n/g, '<br>'),
            timestamp: new Date().toLocaleString(),
            year: new Date().getFullYear()
        };

        const template = loadEmailTemplate('contact-us');
        const htmlContent = template(sanitizedData);
        const info = await transporter.sendMail({
            from: `"InQueue Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'New Contact Submission - InQueue',
            html: htmlContent
        });
        console.log('Contact form email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending contact form email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sending notification to client when it's their turn at the window
 * // @param {Object} data - Notification data
 * // @returns {Promise<Object>} - Result of sending notification
 */
async function sendWindowNotification(data) {
    try {
        const {
            customerName,
            customerEmail,
            bankName,
            branchName,
            windowNumber,
            message,
            appointmentType
        } = data;

        const subject = `${bankName} - It's Your Turn at Window ${windowNumber}`;
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2d3748; margin-bottom: 5px;">${bankName}</h2>
          <h3 style="color: #4a5568; font-weight: normal; margin-top: 0;">${branchName}</h3>
        </div>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #42b983; margin-top: 0;">Please Proceed to Window ${windowNumber}</h2>
          <p style="color: #4a5568; font-size: 16px;">Hello ${customerName},</p>
          <p style="color: #4a5568; font-size: 16px;">${message}</p>
          <p style="color: #4a5568; font-size: 16px;">Your service type: <strong>${appointmentType}</strong></p>
        </div>
        
        <div style="background-color: #42b983; color: white; text-align: center; padding: 15px; border-radius: 8px;">
          <h3 style="margin: 0; font-size: 20px;">Window ${windowNumber} is Ready to Serve You</h3>
        </div>
        
        <div style="margin-top: 20px; font-size: 14px; color: #718096; text-align: center;">
          <p>Thank you for choosing ${bankName}.</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    `;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: `"${bankName} Queue System" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Window notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending window notification email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendContactFormEmail,
    sendWindowNotification
};