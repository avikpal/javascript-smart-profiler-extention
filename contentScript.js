//Handler request from background page
//this script is to be modified according to the inspected pages need-
//this works kind of a web crawler- traversing dom tree and other stuff
//with the ui

var shouldStopDoingStuff = false;
var standardTimeoutForEachClick = 200;

chrome.extension.onMessage.addListener(function (message, sender) {
    console.log("In content Script Message Recieved is " + message);

    if(message === "start-navigating-dom") {
    	navigateDom("init");
    } else if (message === "start-navigating-dom") {
    	stopNavigatingDom();
    }

    //Send needed information to background page
    chrome.extension.sendMessage("My URL is" + window.location.origin);
});

var navigateDom = function(callbackNode) {
	//custom code suited to my purpose for dom traversal
	if(!shouldStopDoingStuff) {
		if (callbackNode == "init") {
			fireEvent($(".user-nav-wrap"), "click");
			setTimeout(navigateDom("#user-nav-settings"), standardTimeoutForEachClick);
		}
		
		if(callbackNode == "#user-nav-settings") {
			fireEvent($("#user-nav-settings"), "click");
			setTimeout(navigateDom(".list-item"), standardTimeoutForEachClick);
		}

		if(callbackNode == ".list-item") {
			$(".list-item").each(function(){
			if($(this).children("span").html() == "About") {
				fireEvent($(this), "click");
				setTimeout(navigateDom(".disclosure containerless"), standardTimeoutForEachClick);
			}
		});		
		}

		if(callbackNode == ".disclosure containerless") {
			$(".disclosure containerless").each(function(){
				fireEvent($(this), "click");
				//in this scenario no different routes are hit or any view is refreshed 
				//if there is still problem should pass via the same callback mechanism to another
				//function
			});
			setTimeout(chrome.extension.sendMessage("stopping-dom-runner") ,0);
		}
	}
};

var stopNavigatingDom = function() {
	shouldStopDoingStuff = true;
	chrome.extension.sendMessage("stopping-dom-runner");
};

/**
 * Fire an event handler to the specified node. Event handlers can detect that the event was fired programatically
 * by testing for a 'synthetic=true' property on the event object -> this is important
 * @param {HTMLNode} node The node to fire the event handler on.
 * @param {String} eventName The name of the event without the "on" (e.g., "focus")
 */
function fireEvent(node, eventName) {
    // Make sure the ownerDocument from the provided node is used to avoid cross-window problems
    var doc;
    if (node.ownerDocument) {
        doc = node.ownerDocument;
    } else if (node.nodeType == 9){
        // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
        doc = node;
    } else {
        throw new Error("Invalid node passed to fireEvent: " + node.id);
    }

     if (node.dispatchEvent) {
        // Gecko-style approach (now the standard) takes more work
        var eventClass = "";

        // Different events have different event classes.
        // If this switch statement can't map an eventName to an eventClass,
        // the event firing is going to fail.
        switch (eventName) {
            case "click": 	// Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
            				//though not a problem in this regard
            case "mousedown":
            case "mouseup":
                eventClass = "MouseEvents";
                break;

            case "focus":
            case "change":
            case "blur":
            case "select":
                eventClass = "HTMLEvents";
                break;

            default:
                throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                break;
        }
        var event = doc.createEvent(eventClass);

        var bubbles = eventName == "change" ? false : true;
        event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

        event.synthetic = true; // allow detection of synthetic events
        // The second parameter says go ahead with the default action
        node.dispatchEvent(event, true);
    } else  if (node.fireEvent) {
        // IE-old school style -> not exactly an issue here
        var event = doc.createEventObject();
        event.synthetic = true; // allow detection of synthetic events
        node.fireEvent("on" + eventName, event);
    }
};

//sender.tab
function setUpProfilerDataAccumulator(tab) {
    var heapData,
    debugId = {tabId:tab.id};
    chrome.debugger.attach(debugId, '1.0', function() {   
    chrome.debugger.sendCommand(debugId, 'Debugger.enable', {}, function() {

        function headerListener(source, name, data) {
            if(source.tabId == tab.id && name == 'HeapProfiler.addProfileHeader') {
              function chunkListener(source, name, data) {
                if(name == 'HeapProfiler.addHeapSnapshotChunk') {
                  heapData += data.chunk;
                } else if(name == 'HeapProfiler.finishHeapSnapshot') {
                  chrome.debugger.onEvent.removeListener(chunkListener);
                  chrome.debugger.detach(debugId);
                  //do something with data
                  console.log('Collected ' + heapData.length + ' bytes of JSON data');
                }
              }
              chrome.debugger.onEvent.addListener(chunkListener);
              chrome.debugger.sendCommand(debugId, 'HeapProfiler.getHeapSnapshot', {uid:data.header.uid, type:data.header.typeId});
            }
            chrome.debugger.onEvent.removeListener(headerListener);
          };

          chrome.debugger.onEvent.addListener(headerListener);
          chrome.debugger.sendCommand(debugId, 'HeapProfiler.takeHeapSnapshot');
    });
  });
};