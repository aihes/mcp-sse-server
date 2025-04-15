/**
 * Internationalization (i18n) utility for HTML to Image Service
 */

class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.translations = {};
    this.initialized = false;
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    try {
      // Load the current language translations
      await this.loadLanguage(this.currentLanguage);
      
      // Set the language attribute on the HTML element
      document.documentElement.setAttribute('lang', this.currentLanguage);
      
      // Mark as initialized
      this.initialized = true;
      
      // Update all translatable elements
      this.updatePageTranslations();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      return false;
    }
  }

  /**
   * Load a language file
   * @param {string} lang - Language code to load
   */
  async loadLanguage(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language file for ${lang}`);
      }
      
      this.translations = await response.json();
      this.currentLanguage = lang;
      
      // Save the language preference
      localStorage.setItem('language', lang);
      
      return true;
    } catch (error) {
      console.error(`Error loading language ${lang}:`, error);
      return false;
    }
  }

  /**
   * Change the current language
   * @param {string} lang - Language code to switch to
   */
  async changeLanguage(lang) {
    if (lang === this.currentLanguage) return true;
    
    const success = await this.loadLanguage(lang);
    if (success) {
      // Update the language attribute
      document.documentElement.setAttribute('lang', lang);
      
      // Update all translations on the page
      this.updatePageTranslations();
      
      // Dispatch a language change event
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: lang } 
      }));
      
      return true;
    }
    
    return false;
  }

  /**
   * Get a translation by key path
   * @param {string} keyPath - Dot notation path to the translation
   * @param {Object} replacements - Optional replacements for variables in the translation
   * @returns {string} The translated text
   */
  t(keyPath, replacements = {}) {
    if (!this.initialized) {
      console.warn('i18n not initialized yet');
      return keyPath;
    }
    
    // Split the key path and navigate through the translations object
    const keys = keyPath.split('.');
    let value = this.translations;
    
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath;
      }
    }
    
    // If the value is not a string, return the key
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${keyPath}`);
      return keyPath;
    }
    
    // Replace variables in the translation
    let result = value;
    for (const [key, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), replacement);
    }
    
    return result;
  }

  /**
   * Update all translatable elements on the page
   */
  updatePageTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });
    
    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });
    
    // Update elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });
    
    // Update document title if it has a data-i18n attribute
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
      const key = titleElement.getAttribute('data-i18n');
      document.title = this.t(key);
    }
  }
}

// Create a global instance
window.i18n = new I18n();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await window.i18n.init();
  
  // Set up language switcher if it exists
  const languageSwitcher = document.getElementById('language-switcher');
  if (languageSwitcher) {
    languageSwitcher.value = window.i18n.currentLanguage;
    
    languageSwitcher.addEventListener('change', async (event) => {
      const newLang = event.target.value;
      await window.i18n.changeLanguage(newLang);
    });
  }
});
