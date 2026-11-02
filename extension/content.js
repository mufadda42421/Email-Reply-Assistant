/**
 * Email Reply Assistant - Gmail Content Script (Manifest V3)
 * Handles Gmail compose detection, toolbar button injection, contextual email reading, and draft insertion.
 */

(function () {
  'use strict';

  // Config cache (defaults to live secure backend proxy)
  let cachedProxyUrl = 'https://ais-dev-ueqsmv5osoboluroieuszh-773570332054.asia-southeast1.run.app';
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['apiProxyUrl'], (res) => {
      if (res && res.apiProxyUrl && res.apiProxyUrl.trim()) {
        cachedProxyUrl = res.apiProxyUrl.trim().replace(/\/+$/, '');
      }
    });
  }

  // Periodic observer to catch compose boxes as user opens drafts/replies
  const observer = new MutationObserver(() => {
    injectAssistantButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial pass
  setTimeout(injectAssistantButtons, 1000);

  function injectAssistantButtons() {
    // Gmail compose action bars typically have role="toolbar" or class .btC / tr.btC / .gU.Up
    const toolbars = document.querySelectorAll('.btC, tr.btC, [role="toolbar"], .aDh');

    toolbars.forEach((toolbar) => {
      // Check if button already exists in this compose window
      if (toolbar.querySelector('.era-gmail-compose-btn')) return;

      // Locate send button container
      const sendBtn = toolbar.querySelector('[role="button"][data-tooltip*="Send"], .T-I.J-J5-Ji.aoO.v7.T-I-atl.L3, .T-I-atl');
      if (!sendBtn && !toolbar.classList.contains('btC')) return;

      const aiButton = document.createElement('button');
      aiButton.type = 'button';
      aiButton.className = 'era-gmail-compose-btn';
      aiButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
        </svg>
        <span>AI Reply</span>
      `;

      aiButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openGmailAssistantModal(toolbar);
      });

      // Insert adjacent to toolbar
      if (sendBtn && sendBtn.parentNode) {
        sendBtn.parentNode.insertBefore(aiButton, sendBtn.nextSibling);
      } else {
        toolbar.appendChild(aiButton);
      }
    });
  }

  // Extract contextual received email text from the current Gmail thread
  function extractThreadContext() {
    // 1. First check if user highlighted text
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 10) {
      return selection;
    }

    // 2. Look for open message bodies in thread (.ii.gt, .a3s, .adP, .adn)
    const messageBodies = document.querySelectorAll('.ii.gt, .a3s.aiL, [data-message-id] .a3s');
    if (messageBodies.length > 0) {
      // Take the most recent message before the draft
      const lastMessage = messageBodies[messageBodies.length - 1];
      const text = lastMessage.innerText || lastMessage.textContent;
      if (text && text.trim().length > 15) {
        return text.trim();
      }
    }

    // 3. Fallback to generic thread subject or snippet
    const subjectEl = document.querySelector('h2.hP');
    if (subjectEl && subjectEl.innerText) {
      return `Subject: ${subjectEl.innerText}`;
    }

    return '';
  }

  // Open in-page floating assistant modal
  function openGmailAssistantModal(toolbar) {
    // Close existing if open
    const existing = document.querySelector('.era-floating-modal');
    if (existing) existing.remove();

    const composeContainer = toolbar.closest('.M9, .AD, .inboxsdk__compose') || toolbar.closest('table') || toolbar.parentElement;
    const emailContext = extractThreadContext();

    const modal = document.createElement('div');
    modal.className = 'era-floating-modal';

    modal.innerHTML = `
      <div class="era-modal-header">
        <div class="era-modal-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
          <span>Email Reply Assistant</span>
        </div>
        <button class="era-modal-close" title="Close">&times;</button>
      </div>
      <div class="era-modal-body">
        <div class="era-context-preview" title="Detected context from this thread">
          <strong>Context:</strong> ${escapeHtml(emailContext ? emailContext.substring(0, 160) + (emailContext.length > 160 ? '...' : '') : 'No email text detected. Type or paste details below.')}
        </div>

        <div class="era-control-row">
          <select id="eraModalTone" class="era-select">
            <option value="Professional" selected>Professional</option>
            <option value="Friendly">Friendly</option>
            <option value="Casual">Casual</option>
            <option value="Formal">Formal</option>
            <option value="Persuasive">Persuasive</option>
            <option value="Apologetic">Apologetic</option>
          </select>

          <select id="eraModalLength" class="era-select">
            <option value="Short">Short</option>
            <option value="Medium" selected>Medium</option>
            <option value="Detailed">Detailed</option>
          </select>
        </div>

        <button type="button" class="era-gen-btn" id="eraModalGenBtn">
          <span>✨ Generate 3 Replies</span>
        </button>

        <div id="eraModalRepliesList" style="display:flex; flex-direction:column; gap:8px;"></div>
      </div>
    `;

    // Position relative to compose window
    if (composeContainer) {
      composeContainer.style.position = 'relative';
      composeContainer.appendChild(modal);
    } else {
      document.body.appendChild(modal);
    }

    modal.querySelector('.era-modal-close').addEventListener('click', () => {
      modal.remove();
    });

    const genBtn = modal.querySelector('#eraModalGenBtn');
    const repliesContainer = modal.querySelector('#eraModalRepliesList');
    const toneSelect = modal.querySelector('#eraModalTone');
    const lengthSelect = modal.querySelector('#eraModalLength');

    genBtn.addEventListener('click', async () => {
      const contentToUse = emailContext || 'Incoming request for an update or scheduling.';
      genBtn.disabled = true;
      genBtn.innerHTML = '<span>Thinking...</span>';

      try {
        const res = await fetch(`${cachedProxyUrl}/api/generate-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailContent: contentToUse,
            tone: toneSelect.value,
            length: lengthSelect.value,
          }),
        });
        const data = await res.json();
        if (data.replies && data.replies.length > 0) {
          repliesContainer.innerHTML = '';
          data.replies.forEach((rep) => {
            const row = document.createElement('div');
            row.className = 'era-reply-option';
            row.innerHTML = `
              <div class="era-reply-header">
                <span class="era-reply-badge">${escapeHtml(rep.label || 'Reply')}</span>
                <button type="button" class="era-insert-btn">Insert to Draft</button>
              </div>
              <div class="era-reply-content">${escapeHtml(rep.body)}</div>
            `;
            row.querySelector('.era-insert-btn').addEventListener('click', () => {
              insertIntoComposeEditor(rep.body, toolbar);
              modal.remove();
            });
            repliesContainer.appendChild(row);
          });
        } else {
          throw new Error('No replies received');
        }
      } catch (err) {
        console.warn('Gmail assistant fallback triggered:', err);
        const fallbackReplies = [
          {
            label: 'Direct & Clear',
            body: `Hello,\n\nThank you for reaching out. I have reviewed the details and wanted to confirm our alignment on the key points.\n\nPlease let me know if you need any additional clarification or if a brief call would be helpful.\n\nBest regards,\n[Your Name]`,
          },
          {
            label: 'Warm & Rapport',
            body: `Hi there,\n\nI really appreciate you sending this over. Everything looks clear and we are ready to move ahead on our end.\n\nLooking forward to catching up soon!\n\nWarmly,\n[Your Name]`,
          },
          {
            label: 'Action-Oriented',
            body: `Hello,\n\nThanks for the update. To keep momentum:\n\n1. Confirming receipt of the items.\n2. We will follow up with our next milestone by [Proposed Date].\n\nBest regards,\n[Your Name]`,
          },
        ];
        repliesContainer.innerHTML = '';
        fallbackReplies.forEach((rep) => {
          const row = document.createElement('div');
          row.className = 'era-reply-option';
          row.innerHTML = `
            <div class="era-reply-header">
              <span class="era-reply-badge">${escapeHtml(rep.label)}</span>
              <button type="button" class="era-insert-btn">Insert to Draft</button>
            </div>
            <div class="era-reply-content">${escapeHtml(rep.body)}</div>
          `;
          row.querySelector('.era-insert-btn').addEventListener('click', () => {
            insertIntoComposeEditor(rep.body, toolbar);
            modal.remove();
          });
          repliesContainer.appendChild(row);
        });
      } finally {
        genBtn.disabled = false;
        genBtn.innerHTML = '<span>✨ Generate 3 Replies</span>';
      }
    });
  }

  // Insert reply text into the active Gmail compose editor
  function insertIntoComposeEditor(bodyText, toolbarContext) {
    let editor = null;

    if (toolbarContext) {
      const container = toolbarContext.closest('.M9, .AD, .inboxsdk__compose') || toolbarContext.closest('table') || toolbarContext.parentElement;
      if (container) {
        editor = container.querySelector('[role="textbox"][g_editable="true"], div.Am.Al.editable, [aria-label*="Message Body"]');
      }
    }

    if (!editor) {
      editor = document.querySelector('[role="textbox"][g_editable="true"], div.Am.Al.editable, [aria-label*="Message Body"]');
    }

    if (!editor) {
      alert('Could not find active Gmail compose textbox.');
      return false;
    }

    editor.focus();

    // Use execCommand to preserve Gmail undo stack and styling if possible
    const formattedHtml = bodyText.replace(/\n/g, '<br>');
    const success = document.execCommand('insertHTML', false, formattedHtml);

    if (!success) {
      // Fallback
      editor.innerHTML = formattedHtml;
    }

    // Trigger input events so Gmail autosaves draft
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  }

  // Listen to messages from extension popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'GET_GMAIL_CONTENT') {
        const text = extractThreadContext();
        sendResponse({ success: true, text });
        return true;
      }

      if (request.action === 'INSERT_REPLY_INTO_GMAIL') {
        const ok = insertIntoComposeEditor(request.body);
        sendResponse({ success: ok });
        return true;
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
