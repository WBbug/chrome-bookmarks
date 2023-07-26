chrome.contextMenus.remove("5", function () {
  chrome.contextMenus.create({
    id: "5",
    title: "save bookMark",
    contexts: ["all"],
    onclick: saveBookMark,
  });
});

let currentUrl, currentTitle, currentTab;

chrome.storage.local.get(["bookmarks"], (result) => {
  if (result.bookmarks) {
    displayBookmarks(result.bookmarks);
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  currentTab = tabs[0];
  if (currentTab) {
    currentUrl = currentTab.url;
    currentTitle = currentTab.title;
    console.log('currentTab', currentTab);
  }
});

function saveBookMark() {
  let scrollY = 0;
  chrome.scripting.executeScript(
    {
      target: { tabId: currentTab.id },
      func: () => {
        return window.scrollY;
      },
    },
    (results) => {
      if (results && results.length > 0) {
        scrollY = results[0].result;
      }
    }
  );

  const title = prompt("Enter bookmark title:") || currentTitle;
  chrome.storage.local.get(["bookmarks"], (result) => {
    const bookmark = { title, url: currentUrl, position: scrollY };
    const bookmarks = result.bookmarks || [];
    bookmarks.push(bookmark);
    chrome.storage.local.set({ bookmarks });

    console.log(bookmarks);
    displayBookmarks(bookmarks);
  });
}

function displayBookmarks(bookmarks) {
  const container = document.getElementById("bookmarks-container");
  container.innerHTML = "";
  bookmarks.forEach((bookmark) => {
    const bookmarkEl = document.createElement("div");
    bookmarkEl.classList.add("bookmark");
    const titleEl = document.createElement("div");
    titleEl.classList.add("bookmark-title");
    const linkEl = document.createElement("div");
    linkEl.textContent = bookmark.title;
    linkEl.classList.add("bookmark-url");
    linkEl.addEventListener("click", () => jump(bookmark));
    

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeBookmark(bookmark.id));
    removeBtn.classList.add("deletebtn");
    titleEl.appendChild(linkEl);
    bookmarkEl.appendChild(titleEl);
    bookmarkEl.appendChild(removeBtn);
    container.appendChild(bookmarkEl);
  });
}

function jump(bookmark) {
  chrome.tabs.create({active:false, url: bookmark.url }, (newTab) => {

    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (changeInfo.status === 'complete') {

        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
              window.scrollTo(0, bookmark.position);
          }
        });

        chrome.tabs.onUpdated.removeListener(listener);
      }
    });
  });
}
