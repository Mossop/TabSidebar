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
 
const MODE_NORMAL = 0;
const MODE_CLICKOPEN = 1;
const MODE_AUTOHIDE = 2;

var previews = null;

var sidebar = {

prefs: null,

mode: MODE_NORMAL,
hidden: false,
topwindow: null,
sidebar: null,
hoverCapture: null,
clickCapture: null,
splitter: null,

captureDelay: null,
releaseDelay: null,
slideTimer: null,
slideRate: 0,

captureTime: 100,
releaseTime: 100,
slideTime: 0,
slideRefresh: 100,
currentPos: 0,

onSlide: function()
{
	sidebar.currentPos=sidebar.currentPos+sidebar.slideRate;

	var current=Math.round(sidebar.currentPos);
	
	if (sidebar.slideRate>0)
	{
		if (current>=0)
		{
			sidebar.sidebar.style.marginLeft=null;
			if (sidebar.slideTimer)
			{
				window.clearInterval(sidebar.slideTimer);
				sidebar.slideTimer=null;
			}
			sidebar.slideRate=0;
			sidebar.currentPos=0;
			sidebar.fullyCaptured();
		}
		else
		{
			sidebar.sidebar.style.marginLeft=current+"px";
		}
	}
	else
	{
		var target = parseInt(sidebar.sidebar.getAttribute("width"));
		if ((-current)>=target)
		{
			current=-target;
			if (sidebar.slideTimer)
			{
				window.clearInterval(sidebar.slideTimer);
				sidebar.slideTimer=null;
			}
			sidebar.slideRate=0;
			sidebar.currentPos=-target;
			sidebar.sidebar.style.marginLeft=current+"px";
			sidebar.fullyReleased();
		}
		else
		{
			sidebar.sidebar.style.marginLeft=current+"px";
		}
	}
},

onCapture: function(event)
{
	if (!sidebar.captureDelay)
	{
		if (sidebar.releaseDelay)
		{
			window.clearTimeout(sidebar.releaseDelay);
			sidebar.releaseDelay=null;
		}
		else if (sidebar.slideRate<0)
		{
			sidebar.slideRate=-sidebar.slideRate;
		}
		else if (sidebar.slideRate == 0 && !sidebar.isOpen())
		{
			sidebar.captureDelay = window.setTimeout(sidebar.actualCapture,sidebar.captureTime);
		}
	}
},

actualCapture: function()
{
	sidebar.captureDelay=null;
	sidebar.startCapture();
	
	var target = parseInt(sidebar.sidebar.getAttribute("width"));
	if (sidebar.slideTime>0)
	{
		var steps = sidebar.slideTime/sidebar.slideRefresh;
		sidebar.slideRate=target/steps;
		sidebar.slideTimer=window.setInterval(sidebar.onSlide,sidebar.slideRefresh);
	}
	else
	{
		sidebar.slideRate=target;
		sidebar.onSlide();
	}
},

onRelease: function(event)
{
	if (!sidebar.releaseDelay)
	{
		if (sidebar.captureDelay)
		{
			window.clearTimeout(sidebar.captureDelay);
			sidebar.captureDelay=null;
		}
		else if (sidebar.slideRate > 0)
		{
			sidebar.slideRate=-sidebar.slideRate;
		}
		else if (sidebar.slideRate == 0 && sidebar.isOpen())
		{
			sidebar.releaseDelay = window.setTimeout(sidebar.actualRelease,sidebar.releaseTime);
		}
	}
},

actualRelease: function()
{
	sidebar.releaseDelay=null;
	sidebar.startRelease();
	
	var target = parseInt(sidebar.sidebar.getAttribute("width"));
	if (sidebar.slideTime>0)
	{
		var steps = sidebar.slideTime/sidebar.slideRefresh;
		sidebar.slideRate=-target/steps;
		sidebar.slideTimer=window.setInterval(sidebar.onSlide,sidebar.slideRefresh);
	}
	else
	{
		sidebar.slideRate=-target;
		sidebar.onSlide();
	}
},

startCapture: function()
{
	sidebar.hoverCapture.hidden=true;
},

fullyCaptured: function()
{
	sidebar.splitter.hidden=false;

	if (sidebar.mode == MODE_CLICKOPEN)
		sidebar.clickCapture.hidden=false;

	previews.suppressSizing=false;
	
	sidebar.prefs.setIntPref("display.state",1);
},

startRelease: function()
{
	previews.suppressSizing=true;

	sidebar.splitter.hidden=true;

	if (sidebar.mode == MODE_CLICKOPEN)
		sidebar.clickCapture.hidden=true;
},

fullyReleased: function()
{
	sidebar.hoverCapture.hidden=false;
	sidebar.prefs.setIntPref("display.state",0);
},

onClickOpen: function(event)
{
	if (event.button == 0)
		sidebar.actualCapture();
},

onClickClosed: function(event)
{
	if (event.button == 0)
		sidebar.actualRelease();
},

isOpen: function()
{
	if (sidebar.sidebar.style.marginLeft)
	{
		var margin = parseInt(sidebar.sidebar.style.marginLeft);
		return !margin;
	}
	else
	{
		return true;
	}
},

isClosed: function()
{
	return (!sidebar.isOpen() && (sidebar.slideTimer == null));
},

onResize: function(event)
{
	previews.onResize();
},

openPreferences: function()
{
  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);

  var instantApply = prefs.getBoolPref("browser.preferences.instantApply", false);
  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator);
  var win = wm.getMostRecentWindow("Browser:Preferences");
  if (win)
  {
    win.focus();
  }
  else
  {
    openDialog("chrome://tabsidebar/content/preferences.xul",
               "Preferences", features);
	}
},

showTabbar: function()
{
	if (sidebar.hidden)
	{
	 	var tabbrowser = sidebar.topwindow.document.getElementById("content");
	 	var tabstrip = sidebar.topwindow.document.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-tabs");
	 	tabstrip.collapsed=false;
	 	sidebar.hidden=false;
	}
},

hideTabbar: function()
{
	if (!sidebar.hidden)
	{
	  var tabbrowser = sidebar.topwindow.document.getElementById("content");
	  var tabstrip = sidebar.topwindow.document.getAnonymousElementByAttribute(tabbrowser,"class","tabbrowser-tabs");
	  tabstrip.collapsed=true;
	  sidebar.hidden=true;
  }
},

changeMode: function(newmode)
{
	if (newmode == sidebar.mode)
		return;

	switch (sidebar.mode)
	{
		case MODE_NORMAL:
			break;
		case MODE_CLICKOPEN:
			sidebar.hoverCapture.removeEventListener("click",sidebar.onClickOpen,false);
			sidebar.clickCapture.removeEventListener("click",sidebar.onClickClosed,false);
			break;
		case MODE_AUTOHIDE:
			sidebar.hoverCapture.removeEventListener("mouseover",sidebar.onCapture,false);
			sidebar.splitter.removeEventListener("mouseover",sidebar.onCapture,false);
			sidebar.sidebar.removeEventListener("mouseover",sidebar.onCapture,false);
			sidebar.hoverCapture.removeEventListener("mouseout",sidebar.onRelease,false);
			sidebar.splitter.removeEventListener("mouseout",sidebar.onRelease,false);
			sidebar.sidebar.removeEventListener("mouseout",sidebar.onRelease,false);
			break;
	}
	

	switch (newmode)
	{
		case MODE_NORMAL:
			sidebar.clickCapture.hidden=true;
			sidebar.hoverCapture.hidden=true;
			sidebar.splitter.hidden=sidebar.sidebar.hidden;
			sidebar.sidebar.style.marginLeft=null;

			if (sidebar.captureDelay)
				window.clearTimeout(sidebar.captureDelay);
			if (sidebar.releaseDelay)
				window.clearTimeout(sidebar.releaseDelay);
			if (sidebar.slideTimer)
				window.clearTimeout(sidebar.slideTimer);
			sidebar.slideRate=0;
			break;
		case MODE_CLICKOPEN:
			sidebar.hoverCapture.addEventListener("click",sidebar.onClickOpen,false);
			sidebar.clickCapture.addEventListener("click",sidebar.onClickClosed,false);
			
			if (sidebar.isOpen())
			{
				sidebar.clickCapture.hidden=false;
				sidebar.hoverCapture.hidden=true;
			}
			else if (sidebar.isClosed())
			{
				sidebar.clickCapture.hidden=true;
				sidebar.hoverCapture.hidden=false;
			}
			break;
		case MODE_AUTOHIDE:
			sidebar.hoverCapture.addEventListener("mouseover",sidebar.onCapture,false);
			sidebar.splitter.addEventListener("mouseover",sidebar.onCapture,false);
			sidebar.sidebar.addEventListener("mouseover",sidebar.onCapture,false);
			sidebar.hoverCapture.addEventListener("mouseout",sidebar.onRelease,false);
			sidebar.splitter.addEventListener("mouseout",sidebar.onRelease,false);
			sidebar.sidebar.addEventListener("mouseout",sidebar.onRelease,false);

			sidebar.clickCapture.hidden=true;
			if (sidebar.isOpen())
			{
				sidebar.hoverCapture.hidden=true;
				sidebar.onRelease();
			}
			else if (sidebar.isClosed())
			{
				sidebar.hoverCapture.hidden=false;
			}
			else
			{
				sidebar.actualRelease();
			}
			break;
	}
	
	sidebar.mode=newmode;
},

observe: function (aSubject, aTopic, aPrefName)
{
	//dump("pref change\n");
	try
	{
	  if (sidebar.prefs.getBoolPref("hidetabs"))
	  {
	  	sidebar.hideTabbar();
	  }
	  else
	  {
	  	sidebar.showTabbar();
	  }
	  sidebar.changeMode(sidebar.prefs.getIntPref("display.mode"));
	}
	catch (e)
	{
		dump(e);
	}
},

showOptions: function()
{
  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);
  var instantApply = prefs.getBoolPref("browser.preferences.instantApply", false);
  var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator);
  var win = wm.getMostRecentWindow("TabSidebar:Options");
  if (win)
  {
    win.focus();
  }
  else
  {
    window.openDialog("chrome://tabsidebar/content/preferences.xul",
                      "Preferences", features);
	}
},

showHelp: function()
{
	help.openHelp();
},

init: function()
{
	var topwin = window;
	while (topwin.parent && topwin != topwin.parent)
		topwin=topwin.parent;
	sidebar.topwindow=topwin;
	
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var bundle = sbs.createBundle("chrome://tabsidebar/locale/tabsidebar.properties");

	var pos = topwin.document.getElementById("sidebar-throbber");
	var optionsBtn = topwin.document.createElement("toolbarbutton");
	var helpBtn = topwin.document.createElement("toolbarbutton");
	
	optionsBtn.setAttribute("tooltiptext",bundle.GetStringFromName("tabsidebar.options.tooltip"));
	helpBtn.setAttribute("tooltiptext",bundle.GetStringFromName("tabsidebar.help.tooltip"));
	
	optionsBtn.id = "tabsidebar-options";
	helpBtn.id = "tabsidebar-help";
	
	if (pos.nextSibling)
	{
		pos=pos.nextSibling;
		pos.parentNode.insertBefore(optionsBtn,pos);
		pos.parentNode.insertBefore(helpBtn,pos);
	}
	else
	{
		pos.parentNode.appendChild(optionsBtn);
		pos.parentNode.appendChild(helpBtn);
	}
	
	optionsBtn.addEventListener("command",sidebar.showOptions,false);
	helpBtn.addEventListener("command",sidebar.showHelp,false);
	
	sidebar.sidebar=topwin.document.getElementById("sidebar-box");
	sidebar.hoverCapture=topwin.document.getElementById("tabsidebar-hovercapture");
	sidebar.clickCapture=topwin.document.getElementById("tabsidebar-clickcapture");
	sidebar.splitter=topwin.document.getElementById("sidebar-splitter");

	previews = document.getElementById("previews");
	topwin.addEventListener("resize",sidebar.onResize,false);
	
	sidebar.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("tabsidebar.");
  if (sidebar.prefs.getBoolPref("hidetabs"))
  {
  	sidebar.hideTabbar();
  }
  
  sidebar.captureTime=sidebar.prefs.getIntPref("display.capturedelay");
  sidebar.releaseTime=sidebar.prefs.getIntPref("display.releasedelay");
  sidebar.slideTime=sidebar.prefs.getIntPref("display.time");
  sidebar.slideRefresh=Math.min(10,sidebar.prefs.getIntPref("display.speed"));
  
  sidebar.changeMode(sidebar.prefs.getIntPref("display.mode"));
  
  if (sidebar.mode == MODE_CLICKOPEN && sidebar.prefs.getIntPref("display.state") == 0)
  {
  	sidebar.actualRelease();
  }
  
	var prefs = sidebar.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("",sidebar,false);
},
 
destroy: function()
{
	var topwin = sidebar.topwindow;

	var button = topwin.document.getElementById("tabsidebar-options");
	button.parentNode.removeChild(button);
	button = topwin.document.getElementById("tabsidebar-help");
	button.parentNode.removeChild(button);
	
	topwin.removeEventListener("resize",sidebar.onResize,false);
	
	sidebar.showTabbar();
	
	sidebar.changeMode(MODE_NORMAL);

	var prefs = sidebar.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.removeObserver("",sidebar);
}
}
