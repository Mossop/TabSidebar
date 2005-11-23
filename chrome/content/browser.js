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
 * Portions created by the Initial Developer are Copyright (C) 2004
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

// Constructor and destructor
init: function()
{
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("tabsidebar.");

	var sidebarBox = document.getElementById("sidebar-box");

	var self=this;
	sidebarBox.addEventListener("DOMAttrModified", function(event) { self.attributeListener(event); }, false);
	window.addEventListener("unload", function(event) { self.destroy(event); }, false);

	var prefs = this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("",this,false);
},

destroy: function(event)
{
	var prefs = this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.removeObserver("",sidebar);
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
	var sidebarBox = document.getElementById("sidebar-box");
	return sidebarBox.getAttribute("sidebarcommand") == "viewTabSidebar";
},

// Actual methods
showTabbar: function()
{
	if (this.hidden)
	{
	 	var tabbrowser = document.getElementById("content");
	 	var tabstrip = document.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-tabs");
	 	tabstrip.collapsed=false;
	 	this.hidden=false;
	}
},

hideTabbar: function()
{
	if (!this.hidden)
	{
	  var tabbrowser = document.getElementById("content");
	  var tabstrip = document.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-tabs");
	  tabstrip.collapsed=true;
	  this.hidden=true;
  }
},

// Event observers
observe: function (aSubject, aTopic, aPrefName)
{
	//dump("pref change\n");
	
	if (this.isOpen())
	{
		try
		{
		  if (this.prefs.getBoolPref("hidetabs"))
		  {
		  	this.hideTabbar();
		  }
		  else
		  {
		  	this.showTabbar();
		  }
		}
		catch (e)
		{
			dump(e);
		}
	}
},

attributeListener: function(event)
{
	if (event.target.id=="sidebar-box")
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
