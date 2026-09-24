import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android shell for MyApp 会员.
 *
 * The membership catalog, admin, and TNG orders live on the server.
 * Point the APK at the published site before syncing:
 *   CAP_SERVER_URL=https://your-app.example npm run android:sync
 * Without that URL the APK shows www/index.html only.
 */
const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.myapp.huiyuan",
  appName: "MyApp 会员",
  webDir: "www",
  android: {
    allowMixedContent: Boolean(serverUrl?.startsWith("http://")),
  },
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        androidScheme: "https",
      }
    : {
        androidScheme: "https",
      },
};

export default config;
