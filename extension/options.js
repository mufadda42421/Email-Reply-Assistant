/**
 * Email Reply Assistant - Options Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefTone = document.getElementById('prefTone');
  const prefLength = document.getElementById('prefLength');
  const prefLanguage = document.getElementById('prefLanguage');
  const prefProxyUrl = document.getElementById('prefProxyUrl');
  const saveBtn = document.getElementById('saveBtn');
  const saveAlert = document.getElementById('saveAlert');

  // Load stored preferences
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['defaultTone', 'defaultLength', 'defaultLanguage', 'apiProxyUrl'], (res) => {
      if (res.defaultTone) prefTone.value = res.defaultTone;
      if (res.defaultLength) prefLength.value = res.defaultLength;
      if (res.defaultLanguage) prefLanguage.value = res.defaultLanguage;
      if (res.apiProxyUrl) prefProxyUrl.value = res.apiProxyUrl;
      else prefProxyUrl.value = window.location.origin;
    });
  } else {
    prefTone.value = localStorage.getItem('era_defaultTone') || 'Professional';
    prefLength.value = localStorage.getItem('era_defaultLength') || 'Medium';
    prefLanguage.value = localStorage.getItem('era_defaultLanguage') || 'English';
    prefProxyUrl.value = localStorage.getItem('era_apiProxyUrl') || window.location.origin;
  }

  saveBtn.addEventListener('click', () => {
    const data = {
      defaultTone: prefTone.value,
      defaultLength: prefLength.value,
      defaultLanguage: prefLanguage.value,
      apiProxyUrl: prefProxyUrl.value.trim() || window.location.origin,
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(data, () => {
        showSaved();
      });
    } else {
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem(`era_${k}`, v);
      }
      showSaved();
    }
  });

  function showSaved() {
    saveAlert.style.display = 'block';
    setTimeout(() => {
      saveAlert.style.display = 'none';
    }, 3000);
  }
});
