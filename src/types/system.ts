export interface SystemConfiguration {
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

export interface SystemLanguageConfig {
  defaultLanguage?: string;
  availableLanguages?: string[];
}
