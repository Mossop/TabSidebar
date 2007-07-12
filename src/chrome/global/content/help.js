# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Tab Sidebar Display.
#
# The Initial Developer of the Original Code is
#      Dave Townsend <dtownsend@oxymoronical.com>.
#
# Portions created by the Initial Developer are Copyright (C) 2006
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
#
# $HeadURL$
# $LastChangedBy$
# $Date$
# $Revision$
#
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
