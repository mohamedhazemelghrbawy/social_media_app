import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

class NotificationService {
  private readonly client: admin.app.App;

  constructor() {
    const serviceAccount = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          "../../../src/config/social-app-5fa50-firebase-adminsdk-fbsvc-4459bdc445.json",
        ),
      ) as unknown as string,
    );

    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sentNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };
    return await this.client.messaging().send(message);
  }

  async sentNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.all(
      tokens.map((token) => {
        return this.sentNotification({ token, data });
      }),
    );
  }
}

export default new NotificationService();
