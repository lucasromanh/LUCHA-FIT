import { ASSETS } from '../constants';

const styles = `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #0d1b12;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
`;

const headerStyle = `
    background-color: #0d1b12;
    padding: 20px;
    text-align: center;
    border-bottom: 4px solid #13ec5b;
`;

const logoStyle = `
    height: 60px;
    width: auto;
`;

const contentStyle = `
    padding: 30px;
    background-color: #f6f8f6;
`;

const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #13ec5b;
    color: #0d1b12;
    text-decoration: none;
    font-weight: bold;
    border-radius: 6px;
    margin-top: 20px;
`;

const footerStyle = `
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #e7f3eb;
`;

const getBaseHtml = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f0;">
    <div style="${styles}">
        <div style="${headerStyle}">
             <img src="https://luchafit.com${ASSETS.logo}" alt="LUCHA-FIT" style="${logoStyle}" />
        </div>
        <div style="${contentStyle}">
            ${bodyContent}
        </div>
        <div style="${footerStyle}">
            <p>© ${new Date().getFullYear()} LUCHA-FIT. Todos los derechos reservados.</p>
            <p>Centro Deportivo, Ciudad • +123 456 7890</p>
        </div>
    </div>
</body>
</html>
`;

export const getPendingEmail = (name: string, date: string, time: string, service: string) => {
    const title = "Solicitud de Turno Recibida - LUCHA-FIT";
    const body = `
        <h2 style="color: #0d1b12; margin-top: 0;">¡Hola ${name}! 👋</h2>
        <p>Hemos recibido tu solicitud para un turno en <strong>LUCHA-FIT</strong>.</p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">ESTADO ACTUAL</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #f59e0b;">PENDIENTE DE APROBACIÓN</p>
        </div>

        <p>Detalles de la solicitud:</p>
        <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Servicio:</strong> ${service}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Fecha:</strong> ${date}</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Hora:</strong> ${time} hs</li>
        </ul>

        <p>Luciana Burgos ISAK Nivel 1 revisará la disponibilidad y recibirás un nuevo correo cuando tu turno sea confirmado.</p>
    `;
    return getBaseHtml(title, body);
};

export const getConfirmedEmail = (name: string, date: string, time: string, service: string) => {
    const title = "¡Turno Confirmado! - LUCHA-FIT";
    const body = `
        <h2 style="color: #0d1b12; margin-top: 0;">¡Todo listo ${name}! ✅</h2>
        <p>Tu turno ha sido <strong>CONFIRMADO</strong> exitosamente.</p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #13ec5b; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">CUÁNDO</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #0d1b12;">${date} a las ${time} hs</p>
        </div>

        <p>Te esperamos para tu sesión de <strong>${service}</strong>.</p>
        
        <p style="margin-top: 20px;"><strong>Recomendaciones:</strong></p>
        <ul style="padding-left: 20px; color: #555;">
            <li>Asistir con ropa cómoda (short/top deportivo) para las mediciones.</li>
            <li>Traer estudios previos si tienes.</li>
            <li>Llegar 5 minutos antes del horario pactado.</li>
        </ul>

         <center>
            <a href="#" style="${buttonStyle}">Ver ubicación en Mapa</a>
        </center>
    `;
    return getBaseHtml(title, body);
};

export const getReminderEmail = (name: string, date: string, time: string, service: string) => {
    const title = "Recordatorio de Turno - LUCHA-FIT";
    const body = `
        <h2 style="color: #0d1b12; margin-top: 0;">Recordatorio ⏰</h2>
        <p>Hola ${name}, te recordamos que tienes un turno hoy en <strong>LUCHA-FIT</strong>.</p>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #13ec5b;">HOY</p>
            <p style="font-size: 32px; font-weight: black; margin: 10px 0; color: #0d1b12;">${time} hs</p>
            <p style="margin: 0; color: #666;">${service}</p>
        </div>

        <p>¡Te esperamos!</p>
        <p style="font-size: 13px; color: #999;">Si necesitas cancelar o reprogramar, por favor contáctanos lo antes posible.</p>
    `;
    return getBaseHtml(title, body);
};
