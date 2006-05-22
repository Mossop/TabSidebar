/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Tab Sidebar Display.
 *
 * The Initial Developer of the Original Code is
 *      Dave Townsend <dave.townsend@blueprintit.co.uk>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 *
 * $HeadURL$
 * $LastChangedBy$
 * $Date$
 * $Revision$
 *
 */

var TabSidebarHandler = {

// Variables
prefs: null,
hidden: false,
doc: null,
position: 0,

// Constructor and destructor
init: function()
{
	this.doc = document;
	
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("extensions.tabsidebar.").QueryInterface(Components.interfaces.nsIPrefBranch2);

	var sidebarBox = this.doc.getElementById("sidebar-box");
	var sidebar = this.doc.getElementById("sidebar");

	var self=this;
	sidebarBox.addEventListener("DOMAttrModified", function(event) { self.attributeListener(event); }, false);
	sidebar.addEventListener("load", function(event) { self.sidebarLoad(event); }, true);
	
	this.position=this.prefs.getIntPref("position");

  this.prefs.addObserver("",this,false);
  
  window.addEventListener("load", function(event) { self.load(event); }, false);
  window.addEventListener("unload", TabSidebarHandler.unload, false);
},

unload: function()
{
  window.removeEventListener("unload", TabSidebarHandler.unload, false);
  TabSidebarHandler.prefs.removeObserver("",TabSidebarHandler);
},

getContainer: function()
{
	var container = null;
	
	switch (this.position)
	{
		case 1:	container = document.getElementById("tabsidebar-top-container");
						break;
		case 2:	container = document.getElementById("tabsidebar-bottom-container");
						break;
		case 3:	container = document.getElementById("tabsidebar-left-container");
						break;
		case 4:	container = document.getElementById("tabsidebar-right-container");
						break;
	}
	return container;
},

getSplitter: function()
{
	var splitter = null;
	
	switch (this.position)
	{
		case 1:	splitter = document.getElementById("tabsidebar-top-splitter");
						break;
		case 2:	splitter = document.getElementById("tabsidebar-bottom-splitter");
						break;
		case 3:	splitter = document.getElementById("tabsidebar-left-splitter");
						break;
		case 4:	splitter = document.getElementById("tabsidebar-right-splitter");
						break;
	}
	return splitter;
},

createPreviews: function(container)
{
	var previews = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","tabpreviews");
	if (this.position>2)
		previews.setAttribute("class","tbs-tabpreviews-vertical");
	else
		previews.setAttribute("class","tbs-tabpreviews-horizontal");
	previews.setAttribute("flex","1");
	previews.setAttribute("id","tabsidebar-previews");
	container.appendChild(previews);
},

toggleSidebar: function()
{
	if (this.position==0)
		toggleSidebar('viewTabSidebar');
	else
	{
		var command = document.getElementById("viewTabSidebar");
		var container = this.getContainer();
		var splitter = this.getSplitter();
		if (this.isOpen())
		{
			this.sidebarDestroy();
			container.firstChild._destroy();
			container.removeChild(container.firstChild);
			container.setAttribute("hidden","true");
			splitter.setAttribute("hidden","true");
			command.setAttribute("checked","false");
		}
		else
		{
			container.setAttribute("hidden","false");
			splitter.setAttribute("hidden","false");
			this.createPreviews(container);
			this.sidebarInitialise();
			command.setAttribute("checked","true");
		}
	}
},

sidebarLoad: function(event)
{
	var sidebar = this.doc.getElementById("sidebar");
	if (sidebar.contentDocument == event.target)
	{
		if (sidebar.parentNode.getAttribute("sidebarcommand") == "viewTabSidebar" && sidebar.currentURI.spec == "about:blank")
		{
			sidebar.contentDocument.documentElement.style.backgroundColor = "-moz-dialog";
		}
	}
},

// Sidebar opening and closing
sidebarInitialise: function()
{
  if (this.prefs.getBoolPref("hidetabs"))
  {
  	this.hideTabbar();
  }
},

sidebarDestroy: function()
{
	this.showTabbar();
},

isOpen: function()
{
	if (this.position==0)
	{
		var sidebarBox = this.doc.getElementById("sidebar-box");
		return sidebarBox.getAttribute("sidebarcommand") == "viewTabSidebar";
	}
	else
	{
		var container = this.getContainer();
		return !container.hidden;
	}
},

showTabbar: function()
{
	if (this.hidden)
	{
	 	var tabbrowser = this.doc.getElementById("content");
	 	var tabstrip = this.doc.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-tabs");
	 	tabstrip.collapsed=false;
	 	this.hidden=false;
	}
},

hideTabbar: function()
{
	if (!this.hidden)
	{
	  var tabbrowser = this.doc.getElementById("content");
	  var tabstrip = this.doc.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-tabs");
	  tabstrip.collapsed=true;
	  this.hidden=true;
  }
},

// Event observers
load: function(event)
{
	if ((this.position!=0)&&(this.isOpen()))
	{
		var command = document.getElementById("viewTabSidebar");
		var container = this.getContainer();
		this.createPreviews(container);
		this.sidebarInitialise();
		command.setAttribute("checked","true");
	}
},

observe: function (subject, topic, data)
{
	if (data=="hidetabs")
	{
		if (this.isOpen())
		{
		  if (this.prefs.getBoolPref(data))
		  {
		  	this.hideTabbar();
		  }
		  else
		  {
		  	this.showTabbar();
		  }
		}
	}
	else if (data=="position")
	{
		var open = this.isOpen();
		if (open)
			this.toggleSidebar();
		this.position=this.prefs.getIntPref(data);
		if (open)
			this.toggleSidebar();
	}
},

attributeListener: function(event)
{
	if (event.eventPhase==Event.AT_TARGET)
	{
		if (event.attrName=="sidebarcommand")
		{
			if (event.newValue == "viewTabSidebar")
			{
				//dump("sidebar open\n");
				this.sidebarInitialise();
			}
			else if (event.prevValue == "viewTabSidebar")
			{
				//dump("sidebar close\n");
				this.sidebarDestroy();
			}
		}
		//dump(event.attrName+" "+event.prevValue+" -> "+event.newValue+"\n");
	}
}

}

TabSidebarHandler.init();