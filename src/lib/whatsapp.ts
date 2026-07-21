import { addWhatsAppLog, getWhatsAppSettings, addPaymentSlip, getMember, PaymentSlip } from './db';

/**
 * Simulates sending a WhatsApp Business API message.
 * Logs to the console and records it inside the mock database log.
 */
export const sendWhatsAppMsg = (
  gymId: string,
  phone: string,
  message: string,
  type: string
): { success: boolean; error?: string } => {
  const settings = getWhatsAppSettings(gymId);

  // Check if bot is connected
  if (!settings.botConnected) {
    console.log(`[WhatsApp Gateway] Skipped message to ${phone}. WhatsApp Bot is disconnected.`);
    return { success: false, error: 'WhatsApp Bot is disconnected. Pair your number first.' };
  }

  // Simulated WhatsApp Business API payload
  console.log(`
===================================================
[WHATSAPP BUSINESS API SIMULATION]
Source Tenant Gym: ${gymId}
To Phone Number: ${phone}
Message Type: ${type}
Message Body: "${message}"
Status: Delivered ✔✔ (Status Hook: Read)
===================================================
  `);

  // Record log in DB
  addWhatsAppLog({
    gymId,
    receiverPhone: phone,
    message,
    status: 'Read',
    type,
  });

  return { success: true };
};

/**
 * Simulates the Inbound AI Payment Slip OCR Reader via WhatsApp.
 * Simulates parsing LKR Amount, Bank Name, and Date from a receipt image,
 * and adds it to the payment slips registry with status 'AI Verified'.
 */
export const simulateSlipOcr = async (
  gymId: string,
  memberId: string,
  bankName: string,
  amount: number,
  fileName: string
): Promise<{ success: boolean; slip?: PaymentSlip; error?: string }> => {
  
  const settings = getWhatsAppSettings(gymId);
  if (!settings.botConnected) {
    return { success: false, error: 'WhatsApp Bot is disconnected.' };
  }

  const member = getMember(gymId, memberId);
  if (!member) {
    return { success: false, error: 'Member not found under this gym.' };
  }

  // Simulate AI OCR processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Add the slip into the database with 'AI Verified' status!
  const newSlip = addPaymentSlip({
    tenantType: 'MEMBER',
    referenceId: memberId,
    amount,
    bankName,
    slipImage: fileName,
  });

  // Update status to 'AI Verified' explicitly
  // Get slips from localStorage and update
  const slipsList = localStorage.getItem('fitpulse_slips');
  if (slipsList) {
    const parsed = JSON.parse(slipsList) as PaymentSlip[];
    const idx = parsed.findIndex(s => s.id === newSlip.id);
    if (idx > -1) {
      parsed[idx].status = 'AI Verified';
      localStorage.setItem('fitpulse_slips', JSON.stringify(parsed));
      newSlip.status = 'AI Verified';
    }
  }

  // Log the inbound OCR verification confirmation to WhatsApp logs
  const confirmationMsg = `🤖 [AI Bot OCR] Payment Slip receipt parsed! Bank: ${bankName}, Amount: LKR ${amount.toLocaleString()}, Reference: ${memberId}. Verified successfully.`;
  
  addWhatsAppLog({
    gymId,
    receiverPhone: member.phone || '+94 77 000 0000',
    message: confirmationMsg,
    status: 'Read',
    type: 'Inbound OCR Parser',
  });

  return { success: true, slip: newSlip };
};
