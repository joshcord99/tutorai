chrome.runtime.onInstalled.addListener(() => {});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url?.includes("leetcode.com/problems/")) {
    chrome.tabs.sendMessage(tab.id!, { action: "toggle" }, (response) => {});
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url?.includes("leetcode.com/problems/")) {
        chrome.tabs.sendMessage(
          tabs[0].id!,
          { action: "toggle" },
          (response) => {}
        );
      }
    });
  }
});
