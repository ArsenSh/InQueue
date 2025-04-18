const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function sendWindowSmsNotification(data) {
    try {
        const {
            customerName,
            customerPhone,
            bankName,
            branchName,
            windowNumber,
            message
        } = data;

        let formattedPhone = customerPhone;
        if (!customerPhone.startsWith('+')) {
            formattedPhone = `+${customerPhone}`;
        }

        const smsMessage = message ||
            `Hello ${customerName}, please proceed to Window ${windowNumber} for your service at ${bankName}, ${branchName}.`;

        const result = await client.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        console.log('SMS notification sent:', result.sid);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('Error sending SMS notification:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendWindowSmsNotification
};