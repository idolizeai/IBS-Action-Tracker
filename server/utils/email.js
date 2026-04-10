import fetch from "node-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

// ENV
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const emailUser = process.env.EMAIL_USER;

// 🔑 Get Access Token
async function getAccessToken() {
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
        client_id: clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: clientSecret,
        grant_type: "client_credentials",
    });

    const response = await fetch(tokenEndpoint, {
        method: "POST",
        body,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`${data.error}: ${data.error_description}`);
    }

    return data.access_token;
}

// 🚀 Create "transporter" (like Nodemailer)
async function createTransporter() {
    const accessToken = await getAccessToken();

    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });
}

// 📩 Send Mail (Nodemailer-like)
export const sendMail = async ({ to, subject, html }) => {
    try {
        const client = await createTransporter();

        const recipients = Array.isArray(to) ? to : [to];

        const mailData = {
            message: {
                subject,
                body: {
                    contentType: "HTML",
                    content: html,
                },
                toRecipients: recipients.map((email) => ({
                    emailAddress: { address: email },
                })),
            },
            saveToSentItems: true,
        };

        const data = await client.api(`/users/${emailUser}`).get();
        await client.api(`/users/${emailUser}/sendMail`).post(mailData);
        console.log("data", data)

        return {
            error: false,
            message: "Mail sent successfully",
            statusCode: 200,
        };
    } catch (error) {
        return {
            error: true,
            message: error.message,
            statusCode: 500,
        };
    }
};