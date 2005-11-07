var help = {

locateHelpWindow: function(helpFileURI)
{
	const wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
                       .getService(Components.interfaces.nsIWindowMediator);
	const iterator = wm.getEnumerator("mozilla:help");
	var topWindow = null;
	var aWindow;

	// Loop through help windows looking for one with selected helpFileURI
	while (iterator.hasMoreElements())
	{
		aWindow = iterator.getNext();
		if (aWindow.getHelpFileURI() == helpFileURI)
			topWindow = aWindow;
	}
	return topWindow;
},

openHelp: function()
{
	var helpFileURI = "chrome://tabsidebar/locale/help/help.rdf";
	var topic = null;
	
	var topWindow = help.locateHelpWindow(helpFileURI);

	if (topWindow)
	{
		// Open topic in existing window.
		topWindow.focus();
		topWindow.displayTopic(topic);
	}
	else
	{
		// Open topic in new window.
		const params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock);
		params.SetNumberStrings(2);
		params.SetString(0, helpFileURI);
		params.SetString(1, topic);
		const ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(Components.interfaces.nsIWindowWatcher);
		ww.openWindow(null, "chrome://help/content/help.xul", "_blank", "chrome,all,alwaysRaised,dialog=no", params);
	}
}
}
