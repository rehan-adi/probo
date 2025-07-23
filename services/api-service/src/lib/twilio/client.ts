import twilio from 'twilio';
import { ENV } from '@/config/env';

export const twilioClient = twilio(ENV.TWILIO_SID, ENV.TWILIO_TOKEN);
