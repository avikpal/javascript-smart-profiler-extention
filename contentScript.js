//Handler request from background page
//this script is to be modified according to the inspected pages need-
//this works kind of a web crawler- traversing dom tree and other stuff
//with the ui

var shouldStopDoingStuff = false;
var standardTimeoutForEachClick = 200;

chrome.extension.onMessage.addListener(function (message, sender) {
    console.log("In content Script Message Recieved is " + message);

    if(message === "start-navigating-dom") {
    	navigateDom();
    } else if (message === "start-navigating-dom") {
    	stopNavigatingDom();
    }

    //Send needed information to background page
    chrome.extension.sendMessage("My URL is" + window.location.origin);
});

var navigateDom = function() {
	//custom code suited to my purpose for dom traversal
	fireEvent($(".user-nav-wrap"), "click");
	pendingTimer = setTimeout(fireEvent($("#user-nav-settings"), "click"), standardTimeoutForEachClick);
	$(".list-item").each(function(){
		if($(this).children("span").html() == "About") {
			setTimeout(fireEvent($(this), "click"), standardTimeoutForEachClick);
			//migrated to a seperate function for better readability
			setTimeout(function(){navgateThroughShellPackageList()}, 0);
		}
	});
};

var navgateThroughShellPackageList = function() {
	$(".disclosure containerless").each(function(){
		setTimeout(fireEvent($(this), "click"), standardTimeoutForEachClick);
	});
}

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