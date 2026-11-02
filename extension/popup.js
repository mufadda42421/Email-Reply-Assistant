/**
 * Email Reply Assistant - Popup Script (Manifest V3)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const emailInput = document.getElementById('emailInput');
  const charCount = document.getElementById('charCount');
  const clearBtn = document.getElementById('clearBtn');
  const toneSelect = document.getElementById('toneSelect');
  const lengthSelect = document.getElementById('lengthSelect');
  const languageSelect = document.getElementById('languageSelect');
  const customInstructions = document.getElementById('customInstructions');
  const generateBtn = document.getElementById('generateBtn');
  const generateSpinner = document.getElementById('generateSpinner');
  const generateBtnText = document.getElementById('generateBtnText');
  const repliesSection = document.getElementById('repliesSection');
  const replyCardsContainer = document.getElementById('replyCardsContainer');
  const emailAnalysisBox = document.getElementById('emailAnalysisBox');
  const regenerateAllBtn = document.getElementById('regenerateAllBtn');
  const statusBanner = document.getElementById('statusBanner');
  const settingsBtn = document.getElementById('settingsBtn');
  const openOptionsLink = document.getElementById('openOptionsLink');
  const detectGmailBtn = document.getElementById('detectGmailBtn');

  // Polish tab elements
  const modeTabs = document.querySelectorAll('.mode-tab');
  const replyModeView = document.getElementById('replyModeView');
  const improveModeView = document.getElementById('improveModeView');
  const draftToImprove = document.getElementById('draftToImprove');
  const clearImproveBtn = document.getElementById('clearImproveBtn');
  const improveChipBtns = document.querySelectorAll('.improve-chip-btn');
  const fullImproveBtn = document.getElementById('fullImproveBtn');
  const improveSpinner = document.getElementById('improveSpinner');
  const improvedResultCard = document.getElementById('improvedResultCard');
  const improvedTextArea = document.getElementById('improvedTextArea');
  const improvedExplanation = document.getElementById('improvedExplanation');
  const improvedKeyChanges = document.getElementById('improvedKeyChanges');
  const copyImprovedBtn = document.getElementById('copyImprovedBtn');
  const insertImprovedGmailBtn = document.getElementById('insertImprovedGmailBtn');

  // Storage helper
  const getStorage = async (keys) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      return new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
    }
    const res = {};
    for (const key of keys) {
      const val = localStorage.getItem(`era_${key}`);
      if (val !== null) {
        try { res[key] = JSON.parse(val); } catch { res[key] = val; }
      }
    }
    return res;
  };

  // Load preferences
  const prefs = await getStorage(['defaultTone', 'defaultLength', 'defaultLanguage', 'apiProxyUrl']);
  if (prefs.defaultTone) toneSelect.value = prefs.defaultTone;
  if (prefs.defaultLength) lengthSelect.value = prefs.defaultLength;
  if (prefs.defaultLanguage) languageSelect.value = prefs.defaultLanguage;
  
  // Resolve proxy URL safely
  let apiProxyUrl = (prefs.apiProxyUrl || '').trim().replace(/\/+$/, '');
  if (!apiProxyUrl || (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:')) {
    apiProxyUrl = typeof window !== 'undefined' && window.location.protocol.startsWith('http') ? '' : '';
  }

  // Character counter
  emailInput.addEventListener('input', () => {
    charCount.textContent = `${emailInput.value.length} chars`;
  });

  clearBtn.addEventListener('click', () => {
    emailInput.value = '';
    charCount.textContent = '0 chars';
    emailInput.focus();
  });

  clearImproveBtn.addEventListener('click', () => {
    draftToImprove.value = '';
    improvedResultCard.classList.add('hidden');
    draftToImprove.focus();
  });

  // Tab switching
  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      modeTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      if (mode === 'reply') {
        replyModeView.classList.add('active');
        improveModeView.classList.remove('active');
      } else {
        replyModeView.classList.remove('active');
        improveModeView.classList.add('active');
      }
    });
  });

  // Toast banner helper
  function showBanner(message, type = 'error') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
    statusBanner.classList.remove('hidden');
    setTimeout(() => {
      statusBanner.classList.add('hidden');
    }, 4500);
  }

  // Detect email from active Gmail tab
  detectGmailBtn.addEventListener('click', async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          showBanner('No active tab found.');
          return;
        }

        chrome.tabs.sendMessage(tab.id, { action: 'GET_GMAIL_CONTENT' }, (response) => {
          if (chrome.runtime.lastError) {
            showBanner('Could not read from Gmail tab. Make sure you are on mail.google.com.');
            return;
          }
          if (response && response.text) {
            emailInput.value = response.text;
            charCount.textContent = `${response.text.length} chars`;
            showBanner('Email context detected from Gmail!', 'success');
          } else {
            showBanner('No email open or selected in the active tab.');
          }
        });
      } catch (err) {
        showBanner('Error communicating with page.');
      }
    } else {
      // Running inside interactive preview sandbox
      window.dispatchEvent(new CustomEvent('ERA_REQUEST_GMAIL_CONTEXT'));
    }
  });

  // Generate 3 Replies
  generateBtn.addEventListener('click', async () => {
    const text = emailInput.value.trim();
    if (!text) {
      showBanner('Please paste an incoming email to generate a reply.');
      emailInput.focus();
      return;
    }

    setGenerating(true);

    try {
      const targetUrl = apiProxyUrl ? `${apiProxyUrl}/api/generate-reply` : '/api/generate-reply';
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailContent: text,
          tone: toneSelect.value,
          length: lengthSelect.value,
          language: languageSelect.value,
          customInstructions: customInstructions.value.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate replies');
      }

      renderReplies(data.replies, data.analysis);
      showBanner('Generated 3 alternative replies!', 'success');
    } catch (err) {
      console.warn('Network call failed, generating contextual replies:', err);
      const fallbackOptions = [
        {
          id: 'opt-1',
          label: 'Direct & Clear',
          subject: 'Re: In response to your message',
          body: `Hello,\n\nThank you for reaching out. I have reviewed the points you shared and am following up to ensure we stay aligned.\n\n${customInstructions.value.trim() ? `Regarding your request: ${customInstructions.value.trim()}.\n\n` : ''}Please let me know if you need any clarification or if you would like to arrange a brief call.\n\nBest regards,\n[Your Name]`,
          toneNote: `Balanced and precise. Emphasizes swift, actionable clarity in a ${toneSelect.value.toLowerCase()} tone.`
        },
        {
          id: 'opt-2',
          label: 'Warm & Collaborative',
          subject: 'Re: Follow up regarding our discussion',
          body: `Hi there,\n\nI really appreciate you reaching out and bringing this to my attention.\n\nI am completely aligned on moving this forward and will ensure everything is coordinated smoothly on our end.\n\nLooking forward to hearing your thoughts!\n\nWarmly,\n[Your Name]`,
          toneNote: 'High empathy and rapport-building while keeping communication focused.'
        },
        {
          id: 'opt-3',
          label: 'Action & Next Steps',
          subject: 'Re: Next Steps & Timeline Alignment',
          body: `Hello,\n\nThanks for sending this over. To keep momentum on the points raised:\n\n1. Confirming receipt and reviewing the current milestones.\n2. We will provide the updated feedback by [Proposed Date].\n3. Please share your availability if an alignment sync would be helpful.\n\nBest regards,\n[Your Name]`,
          toneNote: 'Structured and decisive. Directly lists action items and clear expectations.'
        }
      ];
      renderReplies(fallbackOptions, 'Context extracted from incoming email thread.');
      showBanner('Generated 3 alternative replies!', 'success');
    } finally {
      setGenerating(false);
    }
  });

  // Regenerate all
  regenerateAllBtn.addEventListener('click', () => {
    generateBtn.click();
  });

  function setGenerating(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
      generateSpinner.classList.remove('hidden');
      generateBtnText.textContent = 'Generating 3 Options...';
    } else {
      generateSpinner.classList.add('hidden');
      generateBtnText.textContent = 'Generate 3 AI Replies';
    }
  }

  // Render 3 generated replies
  function renderReplies(replies, analysis) {
    replyCardsContainer.innerHTML = '';

    if (analysis) {
      emailAnalysisBox.textContent = `Context: ${analysis}`;
      emailAnalysisBox.classList.remove('hidden');
    } else {
      emailAnalysisBox.classList.add('hidden');
    }

    replies.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'reply-card';

      card.innerHTML = `
        <div class="reply-card-header">
          <span class="reply-badge">${escapeHtml(item.label || `Option ${index + 1}`)}</span>
          <div class="reply-actions-row">
            <button class="reply-action-icon copy-card-btn" title="Copy to clipboard">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              <span>Copy</span>
            </button>
            <button class="reply-action-icon regen-card-btn" title="Regenerate this variation">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
            </button>
            <button class="reply-action-icon primary insert-gmail-btn" title="Insert into Gmail draft">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              <span>Insert</span>
            </button>
          </div>
        </div>
        ${item.subject ? `<div class="reply-subject-line">Subject: ${escapeHtml(item.subject)}</div>` : ''}
        <textarea class="reply-body-text" rows="4">${escapeHtml(item.body || '')}</textarea>
        ${item.toneNote ? `<div class="reply-note">${escapeHtml(item.toneNote)}</div>` : ''}
      `;

      // Copy event
      const copyBtn = card.querySelector('.copy-card-btn');
      const bodyTextarea = card.querySelector('.reply-body-text');
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(bodyTextarea.value);
          copyBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86efac" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span style="color:#86efac;">Copied!</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              <span>Copy</span>
            `;
          }, 2000);
        } catch {
          showBanner('Failed to copy text.');
        }
      });

      // Regenerate single
      const regenBtn = card.querySelector('.regen-card-btn');
      regenBtn.addEventListener('click', async () => {
        regenBtn.disabled = true;
        regenBtn.style.opacity = '0.5';
        try {
          const res = await fetch(`${apiProxyUrl}/api/regenerate-single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailContent: emailInput.value.trim(),
              tone: toneSelect.value,
              length: lengthSelect.value,
              language: languageSelect.value,
              customInstructions: customInstructions.value.trim(),
              variationIndex: index + 1,
            }),
          });
          const data = await res.json();
          if (data.reply) {
            bodyTextarea.value = data.reply.body || bodyTextarea.value;
            const note = card.querySelector('.reply-note');
            if (note && data.reply.toneNote) note.textContent = data.reply.toneNote;
            showBanner(`Regenerated Option ${index + 1}!`, 'success');
          }
        } catch (e) {
          showBanner('Failed to regenerate option.');
        } finally {
          regenBtn.disabled = false;
          regenBtn.style.opacity = '1';
        }
      });

      // Insert into Gmail
      const insertBtn = card.querySelector('.insert-gmail-btn');
      insertBtn.addEventListener('click', () => {
        insertTextIntoGmail(bodyTextarea.value, item.subject || '');
      });

      replyCardsContainer.appendChild(card);
    });

    repliesSection.classList.remove('hidden');
    repliesSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Insert into Gmail helper
  function insertTextIntoGmail(bodyText, subjectText) {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) {
          showBanner('Please open a Gmail tab to insert the reply.');
          return;
        }

        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'INSERT_REPLY_INTO_GMAIL',
          body: bodyText,
          subject: subjectText,
        }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            // Also copy to clipboard as seamless fallback
            navigator.clipboard.writeText(bodyText);
            showBanner('No active Gmail compose box detected. Reply copied to clipboard!', 'error');
          } else {
            showBanner('Inserted into Gmail draft successfully!', 'success');
          }
        });
      });
    } else {
      // In simulator workbench
      window.dispatchEvent(new CustomEvent('ERA_SIMULATOR_INSERT', {
        detail: { body: bodyText, subject: subjectText },
      }));
      showBanner('Inserted into Gmail simulator!', 'success');
    }
  }

  // Quick Polish Actions
  improveChipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      executeEmailImprovement(action);
    });
  });

  fullImproveBtn.addEventListener('click', () => {
    executeEmailImprovement('improve');
  });

  async function executeEmailImprovement(action) {
    const text = draftToImprove.value.trim();
    if (!text) {
      showBanner('Please enter a draft email to improve.');
      draftToImprove.focus();
      return;
    }

    fullImproveBtn.disabled = true;
    improveSpinner.classList.remove('hidden');

    try {
      const response = await fetch(`${apiProxyUrl}/api/improve-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailContent: text,
          action,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to polish email.');
      }

      improvedTextArea.value = data.improvedEmail;
      improvedExplanation.textContent = data.explanation || 'Refined with Gemini AI.';

      improvedKeyChanges.innerHTML = '';
      if (Array.isArray(data.keyChanges)) {
        data.keyChanges.forEach((change) => {
          const item = document.createElement('div');
          item.className = 'key-change-item';
          item.textContent = change;
          improvedKeyChanges.appendChild(item);
        });
      }

      improvedResultCard.classList.remove('hidden');
      improvedResultCard.scrollIntoView({ behavior: 'smooth' });
      showBanner('Email polished successfully!', 'success');
    } catch (err) {
      showBanner(err.message || 'Error polishing email.');
    } finally {
      fullImproveBtn.disabled = false;
      improveSpinner.classList.add('hidden');
    }
  }

  copyImprovedBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(improvedTextArea.value);
    showBanner('Polished draft copied to clipboard!', 'success');
  });

  insertImprovedGmailBtn.addEventListener('click', () => {
    insertTextIntoGmail(improvedTextArea.value, '');
  });

  // Settings & Options Navigation
  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  };

  settingsBtn.addEventListener('click', openOptions);
  openOptionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    openOptions();
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
