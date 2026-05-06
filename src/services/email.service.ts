/**
 * email.service.ts
 * Servicio para envío de correos utilizando la API de Resend.
 * Se utiliza fetch para evitar dependencias externas.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export const emailService = {
    /**
     * Envía un correo electrónico genérico.
     */
    async sendEmail(to: string, subject: string, html: string) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("❌ RESEND_API_KEY no configurada en .env");
            return;
        }

        try {
            const response = await fetch(RESEND_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "SoftPos <onboarding@resend.dev>",
                    to,
                    subject,
                    html,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                console.error("❌ Error de Resend:", data);
            } else {
                console.log(`📧 Email enviado a ${to}: ${subject}`);
            }
            return data;
        } catch (error) {
            console.error("❌ Error al enviar email:", error);
        }
    },

    /**
     * Correo de bienvenida para nuevos registros.
     */
    async sendWelcomeEmail(email: string, name: string) {
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #0247E8;">¡Bienvenido a SoftPos, ${name}!</h1>
                <p>Estamos emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente.</p>
                <p>Ahora puedes comenzar a gestionar tu inventario, ventas y mucho más desde tu panel administrativo.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}" style="background-color: #0247E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Entrar a mi Panel</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
            </div>
        `;
        return this.sendEmail(email, "¡Bienvenido a SoftPos!", html);
    },

    /**
     * Correo para recuperación de contraseña.
     */
    async sendRecoveryEmail(email: string, token: string) {
        const recoveryUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0247E8;">Recuperación de Contraseña</h2>
                <p>Has solicitado restablecer tu contraseña en SoftPos.</p>
                <p>Haz clic en el botón de abajo para elegir una nueva contraseña. Este enlace expira en 15 minutos.</p>
                <div style="margin: 30px 0;">
                    <a href="${recoveryUrl}" style="background-color: #0247E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                </div>
                <p>Si no solicitaste este cambio, simplemente ignora este correo.</p>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">SoftPos SaaS Architecture</p>
            </div>
        `;
        return this.sendEmail(email, "Recupera tu contraseña - SoftPos", html);
    }
};
