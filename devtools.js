//Created a port with background page for continous message communication

var backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});

//Sending a script to inject to background page- here starting traversing down a dom-node clicking
//to be handled by background page

chrome.runtime.sendMessage({
    tabId: chrome.devtools.inspectedWindow.tabId,
    scriptToInject: "contentScript.js"
});
 

//Hanlde response when recieved from background page
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Tab Data recieved is  " + message);
    //update the devtools ui accordingly
    var profilerControlButton = document.getElementById("profilerControl");
    profilerControlButton.value = "Stop smart profiling";
});

chrome.devtools.panels.create("js smart profiler", "icon.png", "jsProfilerPanel.html", function(panel){
	//this is an extentionpanel object referring to the created panel
	console.log("extention has been loaded");
	onShown.addListener(function(panelWindow){
		var profilerControlButton = document.getElementById("profilerControl");
		profilerControlButton.onclick(function(){
			if(profilerControlButton.value() === "Start smart profiling") {
				chrome.runtime.sendMessage({
	    			tabId: chrome.devtools.inspectedWindow.tabId,
	    			message: "start-navigating-dom",
	    			scriptToInject: "contentScript.js"
				});
				profilerControlButton.value = "Stop smart profiling";	
			}
			else {
				chrome.runtime.sendMessage({
	    			tabId: chrome.devtools.inspectedWindow.tabId,
	    			message: "stop-navigating-dom",
	    			scriptToInject: "contentScript.js"
				});
				profilerControlButton.value = "Start smart profiling";
			}
		});
	});

});