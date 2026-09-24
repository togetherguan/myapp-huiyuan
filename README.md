# MyApp 会员

吉隆坡会员折扣 App。打开即成为会员，出示会员码享用食物、服务、店铺折扣，以及电子产品和生活用品会员价。商家后台可添加店家、产品、服务和收款码；顾客用 Touch ’n Go eWallet 把款项付给店家。

## 源码结构

| 路径 | 内容 |
| --- | --- |
| `src/routes` | 页面：首页、分类、店家、扫码、会员卡、我的、付款、后台 |
| `src/components` | 界面组件 |
| `src/lib` | 接口、数据库、购物车、会员码、TNG |
| `migrations` | Postgres 表结构与初始店家（含 Smart Gadget Guru） |
| `public` | 图片、图标、分享图 |
| `android` | Capacitor Android 工程，用来打 APK |
| `www` | 未填写网站地址时，安装包里显示的说明页 |

数据库在部署环境使用 `DATABASE_URL`（Neon Postgres）。本地没有该变量时使用预览数据库。表结构以 `migrations/*.sql` 为准，按文件名顺序执行。

## 本地运行网页版

```bash
npm install
npm run dev
```

开发服务器监听 `0.0.0.0:8080`。

```bash
npm run typecheck
npm run build
```

## 打 Android APK

需要本机安装 JDK 17 和 Android SDK（Android Studio 即可），并设置 `ANDROID_HOME`。

会员数据在服务器上。安装包必须打开**已发布的网站**，另一台手机才能看到后台添加的店家。把下面的网址换成你发布后的地址：

```bash
npm install
CAP_SERVER_URL=https://你的网址 npm run android:sync
cd android
./gradlew assembleDebug
```

调试包在：

`android/app/build/outputs/apk/debug/app-debug.apk`

也可以用 Android Studio 打开 `android/`，菜单 **Build → Build APK(s)**。

未设置 `CAP_SERVER_URL` 时，安装包只显示 `www/index.html` 的说明，不会出现店家列表。改完网址后要重新 `android:sync` 再打包。

正式包：

```bash
cd android
./gradlew assembleRelease
```

发布签名在 Android Studio 里配置，不要把密钥文件提交进仓库。

后台密码写在服务端代码里。这个仓库应保持私有。
