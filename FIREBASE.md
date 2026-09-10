# Firebase — что включить, иначе аккаунты будут только локальными

1. https://console.firebase.google.com/project/arizona-bland-drop-7a218
2. Authentication → Sign-in method → Email/Password → Enable → Save
3. Authentication → Settings → Authorized domains добавь:
   - localhost
   - твой github pages домен, например `ник.github.io`
4. Firestore Database → Rules → вставь файл `firestore.rules` → Publish
5. Сайт открывай только по https (GitHub Pages / Firebase Hosting), не как файл с диска

После регистрации в Firestore появятся:
- users/{uid}
- profiles/{email}
- counters/publicId
