import emailjs from '@emailjs/browser';

type EmailBaseParams = {
    to_email: string;      // EmailJS: destinatario
    client_name: string;   // {{client_name}}
};

type AppointmentParams = EmailBaseParams & {
    service: string;       // {{service}}
    date: string;          // {{date}}
    time: string;          // {{time}}
};

// HARDCODED CREDENTIALS (TO FIX ISSUES)
const SERVICE_ID = 'service_c5zcwhk';
const PUBLIC_KEY = 'Dr6K9IAyQtr93bn_g'; // Corrected from screenshot

// Initialize EmailJS immediately
try {
    if (PUBLIC_KEY) {
        emailjs.init(PUBLIC_KEY);
    }
} catch (error) {
    console.error('[EmailJS] Init failed:', error);
}

const TEMPLATE_PENDING = 'template_epzo6ba'; // Corrected from screenshot
const TEMPLATE_CONFIRMED = 'template_4e17h29'; // Corrected from screenshot

function assertEnv() {
    const missing: string[] = [];
    if (!SERVICE_ID) missing.push('VITE_EMAILJS_SERVICE_ID');
    if (!PUBLIC_KEY) missing.push('VITE_EMAILJS_PUBLIC_KEY');
    if (!TEMPLATE_PENDING) missing.push('VITE_EMAILJS_TEMPLATE_PENDING');
    if (!TEMPLATE_CONFIRMED) missing.push('VITE_EMAILJS_TEMPLATE_CONFIRMED');

    if (missing.length) {
        throw new Error(`Faltan variables en .env: ${missing.join(', ')}`);
    }
}

async function send(templateId: string, params: Record<string, any>) {
    assertEnv();

    return await emailjs.send(SERVICE_ID, templateId, params, { publicKey: PUBLIC_KEY });
}

export const luchafitEmail = {
    // 1) PENDIENTE - Se envía cuando el cliente solicita un turno desde Home
    sendAppointmentPending: (p: AppointmentParams) =>
        send(TEMPLATE_PENDING, {
            email: p.to_email, // FIX: Template expects {{email}} based on screenshot
            to_email: p.to_email,
            client_name: p.client_name,
            service: p.service,
            date: p.date,
            time: p.time,
        }),

    // 2) CONFIRMADO - Se envía cuando confirmas el turno desde el Dashboard
    sendAppointmentConfirmed: (p: AppointmentParams) =>
        send(TEMPLATE_CONFIRMED, {
            email: p.to_email, // FIX: Template expects {{email}} based on screenshot
            to_email: p.to_email,
            client_name: p.client_name,
            service: p.service,
            date: p.date,
            time: p.time,
        }),
};

// Función auxiliar para generar enlaces de WhatsApp
export function generateWhatsAppLink(
    phone: string,
    message: string
): string {
    // Limpia el número de teléfono (elimina espacios, guiones, paréntesis)
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    // URL encode del mensaje
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Templates de mensajes de WhatsApp
export const whatsappMessages = {
    rejection: (clientName: string, date: string, time: string, service: string) =>
        `Hola ${clientName}, lamentablemente debemos cancelar tu turno de ${service} del ${date} a las ${time} por problemas de agenda. ¿Te gustaría reprogramar? Podemos coordinar un nuevo horario.`,

    reschedule: (clientName: string, date: string, time: string, service: string) =>
        `Hola ${clientName}, necesitamos reprogramar tu turno de ${service} del ${date} a las ${time}. ¿Qué día y horario te viene mejor?`,
};
