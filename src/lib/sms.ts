import { addSmsLog, getGym } from './db';

/**
 * Simulates sending an SMS via Sri Lankan SMS gateways (Dialog BizSMS or Textware API).
 * Logs details to the browser/node console and records it inside the mock database.
 */
export const sendLocalSms = (
  gymId: string,
  receiverPhone: string,
  message: string,
  triggerType: string
): { success: boolean; error?: string } => {
  
  const gym = getGym(gymId);
  if (!gym) {
    return { success: false, error: 'Gym not found' };
  }

  // Check if tenant has disabled SMS triggers
  if (!gym.autoSmsEnabled) {
    console.log(`[SMS Gateway] Triggers disabled for ${gym.gymName}. Msg to ${receiverPhone} skipped.`);
    return { success: false, error: 'SMS notifications disabled in settings' };
  }

  // Simulated Gateway payload log
  console.log(`
===================================================
[SRI LANKAN SMS GATEWAY SIMULATION]
Provider: Textware / Dialog BizSMS
Source Tenant: ${gym.gymName} (${gym.id})
To Number: ${receiverPhone}
Message Body: "${message}"
===================================================
  `);

  // Write log to DB
  addSmsLog(gymId, receiverPhone, message, triggerType);

  return { success: true };
};
