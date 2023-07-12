// content.js

window.addEventListener("DOMContentLoaded", function() {
  chrome.tabs.query({ currentWindow: true }, function(tabs) {
    localStorage.setItem("tabs", JSON.stringify(tabs));
    if (!localStorage.getItem("savedTabs"))
      localStorage.setItem("savedTabs", JSON.stringify([]));
    render(JSON.parse(localStorage.getItem("savedTabs")));

    // Retrieve the toggle state from local storage
    if(!localStorage.getItem('blur-state')){
      localStorage.setItem("blur-state", "disabled");
      blurToggle.checked = false;
    }
    else{
      let blurToggle = document.getElementById("blur-toggle");
      if(localStorage.getItem('blur-state') == "enabled"){
        blurToggle.checked = true;
      }
      else{
        blurToggle.checked = false;
      }
      toggleBlur();
    }
  });
});

let ulEl = document.getElementById("links-list");
let deleteEl = document.getElementById("delete-btn");
let saveTabEl = document.getElementById("saveTab-btn");
let blurToggle = document.getElementById("blur-toggle");

// Update blur state in storage when checkbox is toggled
blurToggle.addEventListener("change", toggleBlur);

saveTabEl.addEventListener("click", function() {
  if(!localStorage.getItem("savedTabs")){
    if(localStorage.setItem("savedTabs", JSON.stringify([])));
  }
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    
    let savedTabs = JSON.parse(localStorage.getItem("savedTabs"));
    if (tabs[0].url) savedTabs.push(tabs[0].url);
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));
    render(savedTabs);
    toggleBlur();
  });
});


function toggleBlur() {
  // update blur-state in local storage
  if (blurToggle.checked) {
    localStorage.setItem("blur-state", "enabled");
  } else {
    localStorage.setItem("blur-state", "disabled");
  }

  let tabs = JSON.parse(localStorage.getItem("tabs"));

  if (!localStorage.getItem("tabs")) return;
  if (
    !localStorage.getItem("savedTabs") ||
    JSON.parse(localStorage.getItem("savedTabs")).length === 0
  ) {
    for (let tab of tabs) {
      if (tab.url && !tab.url.startsWith("chrome://")) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            function: () => {
              document.documentElement.style.filter = "none";
              document.removeEventListener("mousemove", handleMousemove);
            },
          },
          () => {}
        );
      }
    }
    return;
  }

  let savedTabs = JSON.parse(localStorage.getItem("savedTabs"));

  if (blurToggle.checked) {
    for (let tab of tabs) {
      if (tab.url && !tab.url.startsWith("chrome://")) {
        if (searchUrl(tab.url, savedTabs)) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              function: () => {
                document.documentElement.style.filter = "blur(5px)";
                document.addEventListener("mousemove", handleMousemove);
              },
            },
            () => {}
          );
        }
      }
    }
  } else {
    for (let tab of tabs) {
      if (tab.url && !tab.url.startsWith("chrome://")) {
        if (searchUrl(tab.url, savedTabs)) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              function: () => {
                document.documentElement.style.filter = "none";
                document.removeEventListener("mousemove", handleMousemove);
              },
            },
            () => {}
          );
        }
      }
    }
  }
}

// Function to handle mousemove event and show non-blur area at cursor position
function handleMousemove(event) {
  const cursorX = event.clientX;
  const cursorY = event.clientY;

  const circleSize = 10; // Adjust the size of the circle

  const nonBlurArea = `
    radial-gradient(
      circle ${circleSize}px at ${cursorX}px ${cursorY}px,
      transparent ${circleSize - 1}px,
      rgba(0, 0, 0, 0.8) ${circleSize}px
    )
  `;

  document.documentElement.style.filter = `blur(5px) ${nonBlurArea}`;
}

// Rest of the code...

function searchUrl(tabUrl, savedTabs){
  let ind = tabUrl.indexOf('.com');
  tabUrl = tabUrl.substring(0, ind+4);
  for(let i=0; i<savedTabs.length; i += 1){
    ind = savedTabs[i].indexOf('.com');
    let substr = savedTabs[i].substring(0, ind+4);
    if(tabUrl === substr) return true;
  }
  return false;
  
}

function render(myLists) {
    let listItems = ""
    for (let i = 0; i < myLists.length; i++) {
        listItems += `
            <li>
                <a target='_blank' href='${myLists[i]}'>
                    ${myLists[i]}
                </a>
            </li>
        `
    }
    ulEl.innerHTML = listItems
}

deleteEl.addEventListener("dblclick", function() {
    localStorage.setItem('savedTabs', JSON.stringify([]));
    render([])
    toggleBlur();
})




