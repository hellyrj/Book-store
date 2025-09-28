// emailService.js
class EmailService {
  static async sendOrderVerificationEmail(userEmail, orderData, isApproved) {
    // In a real app, you'd integrate with SendGrid, Mailgun, etc.
    // For testing, we'll log to console and simulate email sending
    
    const subject = isApproved 
      ? `Order #${orderData.order_id} Payment Verified - BookNest`
      : `Order #${orderData.order_id} Payment Rejected - BookNest`;
    
    const message = isApproved
      ? `
        Dear Customer,

        Great news! Your payment for Order #${orderData.order_id} has been verified.

        Order Details:
        - Order ID: #${orderData.order_id}
        - Total Amount: $${orderData.total_price}
        - Status: Payment Verified

        Your order is now being processed and will be shipped soon.

        Thank you for shopping with BookNest!

        Best regards,
        BookNest Team
      `
      : `
        Dear Customer,

        We regret to inform you that your payment for Order #${orderData.order_id} could not be verified.

        Order Details:
        - Order ID: #${orderData.order_id}
        - Total Amount: $${orderData.total_price}
        - Status: Payment Rejected

        Reason: The payment screenshot provided could not be verified.

        Please contact our support team if you believe this is an error, or place a new order with correct payment details.

        Best regards,
        BookNest Team
      `;

    // Simulate email sending (replace with real email service in production)
    console.log('📧 SENDING EMAIL NOTIFICATION:');
    console.log('To:', userEmail);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('---');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Email notification sent to ${userEmail}`,
      simulated: true // Remove this in production
    };
  }

  static async sendOrderStatusUpdate(userEmail, orderData, newStatus) {
    const statusMessages = {
      'processing': 'is now being processed',
      'shipped': 'has been shipped',
      'delivered': 'has been delivered',
      'cancelled': 'has been cancelled'
    };

    const subject = `Order #${orderData.order_id} Status Update - BookNest`;
    const message = `
      Dear Customer,

      Your order status has been updated.

      Order Details:
      - Order ID: #${orderData.order_id}
      - Total Amount: $${orderData.total_price}
      - New Status: ${newStatus}

      ${statusMessages[newStatus] || 'status has been updated'}.

      Thank you for shopping with BookNest!

      Best regards,
      BookNest Team
    `;

    console.log('📧 SENDING STATUS UPDATE EMAIL:');
    console.log('To:', userEmail);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('---');

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Status update email sent to ${userEmail}`,
      simulated: true
    };
  }
}

export default EmailService;