chrome.runtime.onInstalled.addListener(() => {});

async function sendMessageToTab(tabId: number, message: any): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url?.includes("leetcode.com/problems/")) {
      return false;
    }

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url?.includes("leetcode.com/problems/")) {
    const success = await sendMessageToTab(tab.id!, { action: "toggle" });
    if (!success) {
    }
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "_execute_action") {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url?.includes("leetcode.com/problems/")) {
      const success = await sendMessageToTab(tabs[0].id!, { action: "toggle" });
      if (!success) {
      }
    }
  }
});
