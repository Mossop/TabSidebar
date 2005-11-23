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

const TS_MODE_NORMAL = 0;
const TS_MODE_CLICKOPEN = 1;
const TS_MODE_AUTOHIDE = 2;

var TabSidebarHandler = {

// Variables
prefs: null,
hidden: false,
mode: TS_MODE_NORMAL,
loaded: false,

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

onCaptureEvent: null,
onReleaseEvent: null,
onClickOpenEvent: null,
onClickClosedEvent: null,

// Constructor and destructor
init: function()
{
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("tabsidebar.").QueryInterface(Components.interfaces.nsIPrefBranch2);

	var sidebarBox = document.getElementById("sidebar-box");

	var self=this;
	sidebarBox.addEventListener("DOMAttrModified", function(event) { self.attributeListener(event); }, false);
	window.addEventListener("load", function(event) { self.load(); }, false);
	window.addEventListener("unload", function(event) { self.destroy(event); }, false);

	this.onCaptureEvent = function (event) { self.onCapture(); };
	this.onReleaseEvent = function (event) { self.onRelease(); };
	this.onClickOpenEvent = function (event) { self.onClickOpen(event); };
	this.onClickClosedEvent = function (event) { self.onClickClosed(event); };
	
  this.prefs.addObserver("",this,false);

  this.captureTime=this.prefs.getIntPref("display.capturedelay");
  this.releaseTime=this.prefs.getIntPref("display.releasedelay");
  this.slideTime=this.prefs.getIntPref("display.time");
  this.slideRefresh=Math.min(10,this.prefs.getIntPref("display.speed"));
},

load: function()
{
	//dump("load\n");
	this.loaded=true;
	this.sidebar=document.getElementById("sidebar-box");
	this.hoverCapture=document.getElementById("tabsidebar-hovercapture");
	this.clickCapture=document.getElementById("tabsidebar-clickcapture");
	this.splitter=document.getElementById("sidebar-splitter");
	
	if (this.isOpen())
	{
		this.sidebarInitialise();
	}
},

destroy: function(event)
{
	//dump("destroy\n");
	try
	{
	  this.prefs.removeObserver("",this);
	}
	catch (e)
	{
		dump(e+"\n");
	}
},

// Sidebar opening and closing
sidebarInitialise: function()
{
	if (!this.loaded)
		return;
		
  if (this.prefs.getBoolPref("hidetabs"))
  {
  	this.hideTabbar();
  }

  this.changeMode(this.prefs.getIntPref("display.mode"));
  
  if (this.mode == TS_MODE_CLICKOPEN && this.prefs.getIntPref("display.state") == 0)
  {
  	this.actualRelease();
  }
},

sidebarDestroy: function()
{
	this.changeMode(TS_MODE_NORMAL);
	this.showTabbar();
},

isOpen: function()
{
	var sidebarBox = document.getElementById("sidebar-box");
	return sidebarBox.getAttribute("sidebarcommand") == "viewTabSidebar";
},

isVisible: function()
{
	if (this.sidebar.style.marginLeft)
	{
		var margin = parseInt(this.sidebar.style.marginLeft);
		return !margin;
	}
	else
	{
		return true;
	}
},

isHidden: function()
{
	return (!this.isVisible() && (this.slideTimer == null));
},

// Actual methods
onSlide: function()
{
	this.currentPos=this.currentPos+this.slideRate;

	var current=Math.round(this.currentPos);
	
	if (this.slideRate>0)
	{
		if (current>=0)
		{
			this.sidebar.style.marginLeft=null;
			if (this.slideTimer)
			{
				window.clearInterval(this.slideTimer);
				this.slideTimer=null;
			}
			this.slideRate=0;
			this.currentPos=0;
			this.fullyCaptured();
		}
		else
		{
			this.sidebar.style.marginLeft=current+"px";
		}
	}
	else
	{
		var target = parseInt(this.sidebar.getAttribute("width"));
		if ((-current)>=target)
		{
			current=-target;
			if (this.slideTimer)
			{
				window.clearInterval(this.slideTimer);
				this.slideTimer=null;
			}
			this.slideRate=0;
			this.currentPos=-target;
			this.sidebar.style.marginLeft=current+"px";
			this.fullyReleased();
		}
		else
		{
			this.sidebar.style.marginLeft=current+"px";
		}
	}
},

onCapture: function()
{
	//dump("onCapture\n");
	if (!this.captureDelay)
	{
		if (this.releaseDelay)
		{
			window.clearTimeout(this.releaseDelay);
			this.releaseDelay=null;
		}
		else if (this.slideRate<0)
		{
			this.slideRate=-this.slideRate;
		}
		else if (this.slideRate == 0 && !this.isVisible())
		{
			var self = this;
			this.captureDelay = window.setTimeout(function() { self.actualCapture(); },this.captureTime);
		}
	}
},

actualCapture: function()
{
	//dump("actualCapture\n");
	this.captureDelay=null;
	this.startCapture();
	
	var target = parseInt(this.sidebar.getAttribute("width"));
	if (this.slideTime>0)
	{
		var steps = this.slideTime/this.slideRefresh;
		this.slideRate=target/steps;
		var self = this;
		this.slideTimer=window.setInterval(function() { self.onSlide(); },this.slideRefresh);
	}
	else
	{
		this.slideRate=target;
		this.onSlide();
	}
},

onRelease: function()
{
	//dump("onRelease\n");
	if (!this.releaseDelay)
	{
		if (this.captureDelay)
		{
			window.clearTimeout(this.captureDelay);
			this.captureDelay=null;
		}
		else if (this.slideRate > 0)
		{
			this.slideRate=-this.slideRate;
		}
		else if (this.slideRate == 0 && this.isVisible())
		{
			var self = this;
			this.releaseDelay = window.setTimeout(function() { self.actualRelease(); },this.releaseTime);
		}
	}
},

actualRelease: function()
{
	//dump("actualRelease\n");
	this.releaseDelay=null;
	this.startRelease();
	
	var target = parseInt(this.sidebar.getAttribute("width"));
	if (this.slideTime>0)
	{
		var steps = this.slideTime/this.slideRefresh;
		this.slideRate=-target/steps;
		var self = this;
		this.slideTimer=window.setInterval(function() { self.onSlide(); },this.slideRefresh);
	}
	else
	{
		this.slideRate=-target;
		this.onSlide();
	}
},

startCapture: function()
{
	this.hoverCapture.hidden=true;
},

fullyCaptured: function()
{
	this.splitter.hidden=false;

	if (this.mode == TS_MODE_CLICKOPEN)
		this.clickCapture.hidden=false;

	this.prefs.setIntPref("display.state",1);
},

startRelease: function()
{
	this.splitter.hidden=true;

	if (this.mode == TS_MODE_CLICKOPEN)
		this.clickCapture.hidden=true;
},

fullyReleased: function()
{
	this.hoverCapture.hidden=false;
	this.prefs.setIntPref("display.state",0);
},

onClickOpen: function(event)
{
	if (event.button == 0)
		this.actualCapture();
},

onClickClosed: function(event)
{
	if (event.button == 0)
		this.actualRelease();
},

changeMode: function(newmode)
{
	if (newmode == this.mode)
		return;
		
	var self = this;

	switch (this.mode)
	{
		case TS_MODE_NORMAL:
			break;
		case TS_MODE_CLICKOPEN:
			this.hoverCapture.removeEventListener("click",this.onClickOpenEvent,false);
			this.clickCapture.removeEventListener("click",this.onClickClosedEvent,false);
			break;
		case TS_MODE_AUTOHIDE:
			this.hoverCapture.removeEventListener("mouseover",this.onCaptureEvent,false);
			this.splitter.removeEventListener("mouseover",this.onCaptureEvent,false);
			this.sidebar.removeEventListener("mouseover",this.onCaptureEvent,false);
			this.hoverCapture.removeEventListener("mouseout",this.onReleaseEvent,false);
			this.splitter.removeEventListener("mouseout",this.onReleaseEvent,false);
			this.sidebar.removeEventListener("mouseout",this.onReleaseEvent,false);
			break;
	}
	

	switch (newmode)
	{
		case TS_MODE_NORMAL:
			this.clickCapture.hidden=true;
			this.hoverCapture.hidden=true;
			this.splitter.hidden=this.sidebar.hidden;
			this.sidebar.style.marginLeft=null;

			if (this.captureDelay)
				window.clearTimeout(this.captureDelay);
			if (this.releaseDelay)
				window.clearTimeout(this.releaseDelay);
			if (this.slideTimer)
				window.clearTimeout(this.slideTimer);
			this.slideRate=0;
			break;
		case TS_MODE_CLICKOPEN:
			this.hoverCapture.addEventListener("click",this.onClickOpenEvent,false);
			this.clickCapture.addEventListener("click",this.onClickClosedEvent,false);
			
			if (this.isVisible())
			{
				this.clickCapture.hidden=false;
				this.hoverCapture.hidden=true;
			}
			else if (this.isHidden())
			{
				this.clickCapture.hidden=true;
				this.hoverCapture.hidden=false;
			}
			break;
		case TS_MODE_AUTOHIDE:
			this.hoverCapture.addEventListener("mouseover",this.onCaptureEvent,false);
			this.splitter.addEventListener("mouseover",this.onCaptureEvent,false);
			this.sidebar.addEventListener("mouseover",this.onCaptureEvent,false);
			this.hoverCapture.addEventListener("mouseout",this.onReleaseEvent,false);
			this.splitter.addEventListener("mouseout",this.onReleaseEvent,false);
			this.sidebar.addEventListener("mouseout",this.onReleaseEvent,false);

			this.clickCapture.hidden=true;
			
			this.splitter.hidden=true;

			if (this.captureDelay)
				window.clearTimeout(this.captureDelay);
			if (this.releaseDelay)
				window.clearTimeout(this.releaseDelay);
			if (this.slideTimer)
				window.clearTimeout(this.slideTimer);

			var target = parseInt(this.sidebar.getAttribute("width"));
			this.sidebar.style.marginLeft=-target+"px";
			this.hoverCapture.hidden=false;

			break;
	}
	
	this.mode=newmode;
},

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
		  this.changeMode(this.prefs.getIntPref("display.mode"));
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
