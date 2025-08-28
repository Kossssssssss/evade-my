interface ImportMetaEnv {
  readonly BASE_URL: string;
  // можеш додати ще свої env, якщо треба
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}