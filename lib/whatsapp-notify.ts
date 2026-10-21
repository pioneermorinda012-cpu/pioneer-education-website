/* SERVER ONLY. Pings the owner's own WhatsApp through CallMeBot — a free,
 * unofficial service for sending a WhatsApp message to yourself. This is
 * NOT the official WhatsApp Business API: it's a hobby project that could
 * stop working without notice, so it is used only as a second, optional
 * channel alongside the owner email (lib/mail.ts), which stays the
 * reliable one. Silently does nothing if the two env vars below are not
 * set, and never throws, so it can never block or break an enrolment.
 *
 *   CALLMEBOT_PHONE   the owner's own WhatsApp number, with country code,
 *                      no + or spaces (e.g. 917380261308)
 *   CALLMEBOT_APIKEY  from messaging CallMeBot's own WhatsApp number once:
 *                      https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */
export async function notifyOwnerWhatsApp(text: string): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
    await fetch(url, { method: "GET", cache: "no-store" });
  } catch (e) {
    console.error("callmebot", e);
  }
}
